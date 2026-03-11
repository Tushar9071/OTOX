import { Elysia, t } from "elysia";
import { PrismaClient, RideStatus } from "@prisma/client";
import { calculateFare, getDistanceAndDuration } from "../../services/fareCalculationService";
import { rideMatchingService } from "../../services/rideMatchingService";
import { generateOtp, hashOtp } from "../../services/otpService";
import { socketService } from "../../services/socketService";
import { notificationService } from "../../services/notificationService";
import { checkRateLimit } from "../../config/redis";

const prisma = new PrismaClient();

export const customerRideRoutes = new Elysia()
  .post(
    "/rides/estimate",
    async ({ body }) => {
      const { distanceKm, durationMinutes } = await getDistanceAndDuration(
        body.pickupLat, body.pickupLng, body.dropLat, body.dropLng
      );
      const fare = await calculateFare(distanceKm, durationMinutes);
      return { success: true, data: fare };
    },
    {
      body: t.Object({
        pickupLat: t.Number(),
        pickupLng: t.Number(),
        dropLat: t.Number(),
        dropLng: t.Number(),
      }),
    }
  )

  .post(
    "/rides/book",
    async ({ user, body, set }) => {
      // Rate limit: 5 ride requests per minute
      const allowed = await checkRateLimit(`ratelimit:rides:${user.id}`, 5, 60);
      if (!allowed) {
        set.status = 429;
        return { success: false, error: "Too many ride requests. Please wait." };
      }

      // Check for existing active ride
      const activeRide = await prisma.ride.findFirst({
        where: {
          customerId: user.id,
          status: { in: ["REQUESTED", "ACCEPTED", "DRIVER_ARRIVED", "TRIP_STARTED"] },
        },
      });

      if (activeRide) {
        set.status = 400;
        return { success: false, error: "You already have an active ride" };
      }

      // Calculate fare server-side
      const { distanceKm, durationMinutes } = await getDistanceAndDuration(
        body.pickupLatitude, body.pickupLongitude,
        body.dropLatitude, body.dropLongitude
      );
      const fareBreakdown = await calculateFare(distanceKm, durationMinutes);

      // Generate OTP for trip start
      const otp = generateOtp();
      const hashedOtp = await hashOtp(otp);

      const ride = await prisma.ride.create({
        data: {
          customerId: user.id,
          pickupAddress: body.pickupAddress,
          pickupLatitude: body.pickupLatitude,
          pickupLongitude: body.pickupLongitude,
          dropAddress: body.dropAddress,
          dropLatitude: body.dropLatitude,
          dropLongitude: body.dropLongitude,
          distanceKm,
          estimatedFare: fareBreakdown.totalFare,
          durationMinutes,
          paymentMethod: body.paymentMethod,
          otp: hashedOtp,
        },
      });

      // Broadcast to nearby drivers
      rideMatchingService.broadcastRideRequest(
        ride.id,
        body.pickupLatitude,
        body.pickupLongitude
      );

      return {
        success: true,
        data: {
          ride,
          otp, // Send plain OTP to customer (they show it to driver)
          fareBreakdown,
        },
        message: "Ride requested. Looking for nearby drivers...",
      };
    },
    {
      body: t.Object({
        pickupAddress: t.String(),
        pickupLatitude: t.Number(),
        pickupLongitude: t.Number(),
        dropAddress: t.String(),
        dropLatitude: t.Number(),
        dropLongitude: t.Number(),
        paymentMethod: t.Union([
          t.Literal("CASH"),
          t.Literal("UPI"),
          t.Literal("CARD"),
          t.Literal("WALLET"),
        ]),
      }),
    }
  )

  .get("/rides", async ({ user, query }) => {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const [rides, total] = await Promise.all([
      prisma.ride.findMany({
        where: { customerId: user.id },
        include: {
          driver: { include: { user: { select: { name: true, phone: true } }, vehicle: true } },
          review: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.ride.count({ where: { customerId: user.id } }),
    ]);

    return {
      success: true,
      data: rides,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  })

  .get("/rides/:id", async ({ user, params, set }) => {
    const ride = await prisma.ride.findFirst({
      where: { id: params.id, customerId: user.id },
      include: {
        driver: { include: { user: { select: { name: true, phone: true, avatar: true } }, vehicle: true } },
        review: true,
        payment: true,
      },
    });

    if (!ride) {
      set.status = 404;
      return { success: false, error: "Ride not found" };
    }

    return { success: true, data: ride };
  })

  .get("/rides/:id/status", async ({ user, params, set }) => {
    const ride = await prisma.ride.findFirst({
      where: { id: params.id, customerId: user.id },
      select: { id: true, status: true, driverId: true },
    });

    if (!ride) {
      set.status = 404;
      return { success: false, error: "Ride not found" };
    }

    return { success: true, data: ride };
  })

  .post(
    "/rides/:id/cancel",
    async ({ user, params, body, set }) => {
      const ride = await prisma.ride.findFirst({
        where: { id: params.id, customerId: user.id },
      });

      if (!ride) {
        set.status = 404;
        return { success: false, error: "Ride not found" };
      }

      if (!["REQUESTED", "ACCEPTED", "DRIVER_ARRIVED"].includes(ride.status)) {
        set.status = 400;
        return { success: false, error: "Cannot cancel ride in current status" };
      }

      const updated = await prisma.ride.update({
        where: { id: params.id },
        data: {
          status: RideStatus.CANCELLED,
          cancelledAt: new Date(),
          cancelReason: body.reason || "Cancelled by customer",
          cancelledBy: "customer",
        },
      });

      // Notify driver if ride was accepted
      if (ride.driverId) {
        socketService.sendToDriver(ride.driverId, "ride:cancelled", {
          rideId: ride.id,
          cancelledBy: "customer",
        });

        // Set driver back to ONLINE
        await prisma.driverProfile.update({
          where: { id: ride.driverId },
          data: { status: "ONLINE" },
        });
      }

      return { success: true, data: updated, message: "Ride cancelled" };
    },
    {
      body: t.Object({
        reason: t.Optional(t.String()),
      }),
    }
  )

  .post(
    "/rides/:id/rate",
    async ({ user, params, body, set }) => {
      const ride = await prisma.ride.findFirst({
        where: { id: params.id, customerId: user.id, status: "COMPLETED" },
        include: { driver: true },
      });

      if (!ride) {
        set.status = 404;
        return { success: false, error: "Completed ride not found" };
      }

      if (!ride.driver) {
        set.status = 400;
        return { success: false, error: "No driver to rate" };
      }

      // Check if already reviewed
      const existingReview = await prisma.review.findUnique({ where: { rideId: ride.id } });
      if (existingReview) {
        set.status = 400;
        return { success: false, error: "Already reviewed" };
      }

      const review = await prisma.review.create({
        data: {
          rideId: ride.id,
          giverId: user.id,
          receiverId: ride.driver.userId,
          rating: body.rating,
          comment: body.comment,
        },
      });

      // Recalculate driver average rating
      const ratings = await prisma.review.aggregate({
        where: { receiverId: ride.driver.userId },
        _avg: { rating: true },
      });

      if (ratings._avg.rating) {
        await prisma.driverProfile.update({
          where: { id: ride.driver.id },
          data: { rating: Math.round(ratings._avg.rating * 10) / 10 },
        });
      }

      return { success: true, data: review, message: "Rating submitted" };
    },
    {
      body: t.Object({
        rating: t.Number({ minimum: 1, maximum: 5 }),
        comment: t.Optional(t.String()),
      }),
    }
  );
