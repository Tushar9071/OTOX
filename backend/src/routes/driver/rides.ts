import { Elysia, t } from "elysia";
import { PrismaClient, RideStatus } from "@prisma/client";
import { verifyOtp } from "../../services/otpService";
import { socketService } from "../../services/socketService";
import { payoutService } from "../../services/payoutService";
import { notificationService } from "../../services/notificationService";
import { getDriverLocation } from "../../config/redis";
import { haversineDistance } from "../../utils/distance";

const prisma = new PrismaClient();

export const driverRideRoutes = new Elysia()
  .get("/rides/pending", async ({ user }) => {
    // Rides that were REQUESTED and haven't been accepted yet
    const rides = await prisma.ride.findMany({
      where: { status: "REQUESTED" },
      include: {
        customer: { select: { name: true, phone: true } },
      },
      orderBy: { requestedAt: "desc" },
      take: 10,
    });

    return { success: true, data: rides };
  })

  .post("/rides/:id/accept", async ({ user, params, set }) => {
    const profile = await prisma.driverProfile.findUnique({
      where: { userId: user.id },
      include: { vehicle: true, user: true },
    });

    if (!profile) {
      set.status = 404;
      return { success: false, error: "Driver profile not found" };
    }

    if (profile.status === "BUSY") {
      set.status = 400;
      return { success: false, error: "You are already on a ride" };
    }

    // Use transaction to prevent race condition
    const ride = await prisma.$transaction(async (tx) => {
      const r = await tx.ride.findUnique({ where: { id: params.id } });
      if (!r || r.status !== "REQUESTED") return null;

      return await tx.ride.update({
        where: { id: params.id },
        data: {
          driverId: profile.id,
          status: RideStatus.ACCEPTED,
          acceptedAt: new Date(),
        },
        include: {
          customer: { select: { name: true, phone: true } },
        },
      });
    });

    if (!ride) {
      set.status = 400;
      return { success: false, error: "Ride no longer available" };
    }

    // Update driver status to BUSY
    await prisma.driverProfile.update({
      where: { id: profile.id },
      data: { status: "BUSY" },
    });

    // Get driver's current location for ETA
    const location = await getDriverLocation(profile.id);
    let eta = 5;
    if (location) {
      const dist = haversineDistance(
        location.lat, location.lng,
        ride.pickupLatitude, ride.pickupLongitude
      );
      eta = Math.max(1, Math.round((dist / 20) * 60)); // 20 km/h avg
    }

    // Notify customer via WebSocket
    socketService.sendToCustomer(ride.id, "ride:accepted", {
      rideId: ride.id,
      driverName: profile.user.name,
      driverPhone: profile.user.phone,
      driverRating: profile.rating,
      vehicleNumber: profile.vehicle?.registrationNo || "",
      vehicleColor: profile.vehicle?.color || "",
      driverLatitude: location?.lat || 0,
      driverLongitude: location?.lng || 0,
      eta,
    });

    // Send notification
    await notificationService.sendToUser(
      ride.customerId,
      "RIDE_ACCEPTED",
      "Driver Assigned!",
      `${profile.user.name} is on the way. ETA: ${eta} min`,
      { rideId: ride.id }
    );

    return {
      success: true,
      data: ride,
      message: "Ride accepted",
    };
  })

  .post("/rides/:id/reject", async ({ user, params }) => {
    // Simply acknowledge rejection — ride stays REQUESTED for other drivers
    return { success: true, message: "Ride rejected" };
  })

  .post("/rides/:id/arrived", async ({ user, params, set }) => {
    const profile = await prisma.driverProfile.findUnique({
      where: { userId: user.id },
    });

    const ride = await prisma.ride.findFirst({
      where: { id: params.id, driverId: profile?.id, status: "ACCEPTED" },
    });

    if (!ride) {
      set.status = 400;
      return { success: false, error: "Invalid ride status" };
    }

    const updated = await prisma.ride.update({
      where: { id: params.id },
      data: { status: RideStatus.DRIVER_ARRIVED, driverArrivedAt: new Date() },
    });

    socketService.sendToCustomer(ride.id, "driver:arrived", { rideId: ride.id });

    await notificationService.sendToUser(
      ride.customerId, "SYSTEM",
      "Driver Arrived",
      "Your auto has arrived at the pickup point.",
      { rideId: ride.id }
    );

    return { success: true, data: updated };
  })

  .post(
    "/rides/:id/start",
    async ({ user, params, body, set }) => {
      const profile = await prisma.driverProfile.findUnique({
        where: { userId: user.id },
      });

      const ride = await prisma.ride.findFirst({
        where: { id: params.id, driverId: profile?.id, status: "DRIVER_ARRIVED" },
      });

      if (!ride) {
        set.status = 400;
        return { success: false, error: "Invalid ride status" };
      }

      // Verify OTP
      if (!ride.otp) {
        set.status = 400;
        return { success: false, error: "No OTP generated for this ride" };
      }

      const otpValid = await verifyOtp(body.otp, ride.otp);
      if (!otpValid) {
        set.status = 400;
        return { success: false, error: "Invalid OTP" };
      }

      const updated = await prisma.ride.update({
        where: { id: params.id },
        data: { status: RideStatus.TRIP_STARTED, tripStartedAt: new Date() },
      });

      socketService.sendToCustomer(ride.id, "ride:started", { rideId: ride.id });

      return { success: true, data: updated };
    },
    {
      body: t.Object({ otp: t.String({ minLength: 4, maxLength: 4 }) }),
    }
  )

  .post("/rides/:id/complete", async ({ user, params, set }) => {
    const profile = await prisma.driverProfile.findUnique({
      where: { userId: user.id },
    });

    const ride = await prisma.ride.findFirst({
      where: { id: params.id, driverId: profile?.id, status: "TRIP_STARTED" },
    });

    if (!ride) {
      set.status = 400;
      return { success: false, error: "Invalid ride status" };
    }

    // Calculate final fare based on actual distance/time
    const { calculateFare } = await import("../../services/fareCalculationService");
    const actualDuration = ride.tripStartedAt
      ? Math.round((Date.now() - ride.tripStartedAt.getTime()) / 60000)
      : ride.durationMinutes || 0;

    const fare = await calculateFare(ride.distanceKm, actualDuration);

    const updated = await prisma.ride.update({
      where: { id: params.id },
      data: {
        status: RideStatus.COMPLETED,
        completedAt: new Date(),
        finalFare: fare.totalFare,
        durationMinutes: actualDuration,
        paymentStatus: ride.paymentMethod === "CASH" ? "PAID" : "PENDING",
      },
    });

    // Create payment record
    await prisma.payment.create({
      data: {
        rideId: ride.id,
        amount: fare.totalFare,
        method: ride.paymentMethod,
        status: ride.paymentMethod === "CASH" ? "PAID" : "PENDING",
      },
    });

    // Calculate driver earnings
    await payoutService.calculateEarning(ride.id, fare.totalFare, profile!.id);

    // Update counts
    await Promise.all([
      prisma.driverProfile.update({
        where: { id: profile!.id },
        data: { totalRides: { increment: 1 }, status: "ONLINE" },
      }),
      prisma.customerProfile.updateMany({
        where: { userId: ride.customerId },
        data: { totalRides: { increment: 1 } },
      }),
    ]);

    // Notify customer
    socketService.sendToCustomer(ride.id, "ride:completed", {
      rideId: ride.id,
      finalFare: fare.totalFare,
      fareBreakdown: fare,
    });

    await notificationService.sendToUser(
      ride.customerId, "SYSTEM",
      "Trip Completed!",
      `Your ride is complete. Fare: ₹${fare.totalFare}`,
      { rideId: ride.id }
    );

    return {
      success: true,
      data: { ride: updated, fareBreakdown: fare },
      message: "Ride completed",
    };
  })

  .get("/rides", async ({ user, query }) => {
    const profile = await prisma.driverProfile.findUnique({
      where: { userId: user.id },
    });

    if (!profile) return { success: true, data: [], total: 0 };

    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const [rides, total] = await Promise.all([
      prisma.ride.findMany({
        where: { driverId: profile.id },
        include: {
          customer: { select: { name: true, phone: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.ride.count({ where: { driverId: profile.id } }),
    ]);

    return {
      success: true,
      data: rides,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  });
