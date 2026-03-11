import { Elysia, t } from "elysia";
import { PrismaClient } from "@prisma/client";
import { updateDriverLocation } from "../../config/redis";

const prisma = new PrismaClient();

export const driverLocationRoutes = new Elysia()
  .post(
    "/location",
    async ({ user, body, set }) => {
      const profile = await prisma.driverProfile.findUnique({
        where: { userId: user.id },
      });

      if (!profile) {
        set.status = 404;
        return { success: false, error: "Driver profile not found" };
      }

      // Update Redis for fast geo queries
      await updateDriverLocation(profile.id, body.latitude, body.longitude);

      // Debounced DB update — only update if last update was >30s ago
      const now = new Date();
      const lastUpdate = profile.lastLocationUpdate;
      if (!lastUpdate || now.getTime() - lastUpdate.getTime() > 30000) {
        await prisma.driverProfile.update({
          where: { id: profile.id },
          data: {
            currentLatitude: body.latitude,
            currentLongitude: body.longitude,
            lastLocationUpdate: now,
          },
        });
      }

      // If driver is on an active ride, broadcast location to customer
      const activeRide = await prisma.ride.findFirst({
        where: {
          driverId: profile.id,
          status: { in: ["ACCEPTED", "DRIVER_ARRIVED", "TRIP_STARTED"] },
        },
      });

      if (activeRide) {
        const { socketService } = await import("../../services/socketService");
        socketService.sendToCustomer(activeRide.id, "driver:location", {
          latitude: body.latitude,
          longitude: body.longitude,
        });

        // Also broadcast to admin live map
        socketService.broadcastToAdmins("driver:location", {
          driverId: profile.id,
          latitude: body.latitude,
          longitude: body.longitude,
          rideId: activeRide.id,
        });
      }

      return { success: true };
    },
    {
      body: t.Object({
        latitude: t.Number({ minimum: -90, maximum: 90 }),
        longitude: t.Number({ minimum: -180, maximum: 180 }),
      }),
    }
  );
