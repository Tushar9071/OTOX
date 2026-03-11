import { PrismaClient } from "@prisma/client";
import type { FareBreakdown } from "../types";

const prisma = new PrismaClient();

export async function getFareConfig() {
  const config = await prisma.fareConfig.findFirst({ where: { isActive: true } });
  if (!config) {
    return {
      baseFare: 30,
      perKmRate: 12,
      perMinuteRate: 1.5,
      nightCharge: 1.25,
      surgeMultiplier: 1.0,
    };
  }
  return config;
}

export async function calculateFare(distanceKm: number, durationMinutes: number): Promise<FareBreakdown> {
  const config = await getFareConfig();
  const baseFare = config.baseFare;
  const distanceFare = distanceKm * config.perKmRate;
  const timeFare = durationMinutes * config.perMinuteRate;

  let total = Math.max(baseFare, distanceFare + timeFare);

  const hour = new Date().getHours();
  const isNight = hour >= 23 || hour < 5;
  let nightChargeAmount = 0;
  if (isNight) {
    nightChargeAmount = total * (config.nightCharge - 1);
    total *= config.nightCharge;
  }

  let surgeCharge = 0;
  if (config.surgeMultiplier > 1) {
    surgeCharge = total * (config.surgeMultiplier - 1);
    total *= config.surgeMultiplier;
  }

  return {
    baseFare,
    distanceFare: Math.round(distanceFare * 100) / 100,
    timeFare: Math.round(timeFare * 100) / 100,
    nightCharge: Math.round(nightChargeAmount * 100) / 100,
    surgeCharge: Math.round(surgeCharge * 100) / 100,
    totalFare: Math.ceil(total),
    distanceKm: Math.round(distanceKm * 100) / 100,
    durationMinutes: Math.round(durationMinutes),
  };
}

export async function getDistanceAndDuration(
  pickupLat: number, pickupLng: number,
  dropLat: number, dropLng: number
): Promise<{ distanceKm: number; durationMinutes: number }> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (apiKey) {
    try {
      const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${pickupLat},${pickupLng}&destinations=${dropLat},${dropLng}&key=${encodeURIComponent(apiKey)}`;
      const res = await fetch(url);
      const data = await res.json() as any;

      if (data.rows?.[0]?.elements?.[0]?.status === "OK") {
        return {
          distanceKm: data.rows[0].elements[0].distance.value / 1000,
          durationMinutes: data.rows[0].elements[0].duration.value / 60,
        };
      }
    } catch {
      // Fallback to Haversine
    }
  }

  // Fallback: Haversine with 1.4x road factor
  const { haversineDistance } = await import("../utils/distance");
  const straightLine = haversineDistance(pickupLat, pickupLng, dropLat, dropLng);
  const roadDistance = straightLine * 1.4;
  const avgSpeedKmh = 20; // Indian city traffic
  return {
    distanceKm: Math.round(roadDistance * 100) / 100,
    durationMinutes: Math.round((roadDistance / avgSpeedKmh) * 60),
  };
}
