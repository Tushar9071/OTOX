import { PrismaClient, DriverStatus } from "@prisma/client";
import { getNearbyDrivers, getDriverLocation } from "../config/redis";
import { haversineDistance } from "../utils/distance";
import { notificationService } from "./notificationService";
import { socketService } from "./socketService";
import { logger } from "../middleware/logger";
import type { WsNewRideRequest } from "../types";

const prisma = new PrismaClient();

export const rideMatchingService = {
  async findNearbyDrivers(pickupLat: number, pickupLng: number, radiusKm: number = 3) {
    // Get driver IDs from Redis GEO
    const driverIds = await getNearbyDrivers(pickupLat, pickupLng, radiusKm);

    if (driverIds.length === 0) return [];

    // Filter only ONLINE + approved drivers from DB
    const drivers = await prisma.driverProfile.findMany({
      where: {
        id: { in: driverIds },
        status: DriverStatus.ONLINE,
        isApproved: true,
        isDocumentVerified: true,
      },
      include: {
        user: { select: { name: true, phone: true } },
        vehicle: true,
      },
    });

    // Calculate actual distance and sort
    const driversWithDistance = await Promise.all(
      drivers.map(async (driver) => {
        const location = await getDriverLocation(driver.id);
        const dist = location
          ? haversineDistance(pickupLat, pickupLng, location.lat, location.lng)
          : Infinity;
        return { ...driver, distanceFromPickup: dist };
      })
    );

    return driversWithDistance
      .filter((d) => d.distanceFromPickup <= radiusKm)
      .sort((a, b) => a.distanceFromPickup - b.distanceFromPickup)
      .slice(0, 5);
  },

  async broadcastRideRequest(rideId: string, pickupLat: number, pickupLng: number, radiusKm: number = 3) {
    const ride = await prisma.ride.findUnique({
      where: { id: rideId },
    });

    if (!ride) return;

    const nearbyDrivers = await this.findNearbyDrivers(pickupLat, pickupLng, radiusKm);

    if (nearbyDrivers.length === 0) {
      logger.info({ rideId, radiusKm }, "No nearby drivers found");
      // If radius was 3km, expand to 5km after 30 seconds
      if (radiusKm < 5) {
        setTimeout(() => {
          this.broadcastRideRequest(rideId, pickupLat, pickupLng, 5);
        }, 30000);
      }
      return;
    }

    const request: WsNewRideRequest = {
      rideId: ride.id,
      pickupAddress: ride.pickupAddress,
      pickupLatitude: ride.pickupLatitude,
      pickupLongitude: ride.pickupLongitude,
      dropAddress: ride.dropAddress,
      dropLatitude: ride.dropLatitude,
      dropLongitude: ride.dropLongitude,
      distanceKm: ride.distanceKm,
      estimatedFare: ride.estimatedFare,
      distanceFromDriver: 0,
    };

    for (const driver of nearbyDrivers) {
      // Send via WebSocket
      socketService.sendToDriver(driver.id, "ride:new_request", {
        ...request,
        distanceFromDriver: Math.round(driver.distanceFromPickup * 100) / 100,
      });

      // Send FCM push notification
      if (driver.fcmToken) {
        notificationService.sendPush(
          driver.fcmToken,
          "New Ride Request!",
          `Pickup: ${ride.pickupAddress} (${driver.distanceFromPickup.toFixed(1)}km away) — ₹${ride.estimatedFare}`,
          { rideId: ride.id, type: "RIDE_REQUEST" }
        );
      }
    }

    logger.info({ rideId, driversNotified: nearbyDrivers.length }, "Ride request broadcast");
  },

  generateOtp(): string {
    return Math.floor(1000 + Math.random() * 9000).toString();
  },
};
