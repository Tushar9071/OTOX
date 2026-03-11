import Redis from "ioredis";
import env from "./env";
import { logger } from "../middleware/logger";

let redisClient: Redis | null = null;

export function getRedis(): Redis {
  if (redisClient) return redisClient;

  redisClient = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      if (times > 3) return null;
      return Math.min(times * 200, 2000);
    },
    lazyConnect: true,
  });

  redisClient.on("error", (err) => {
    logger.error({ err }, "Redis connection error");
  });

  redisClient.on("connect", () => {
    logger.info("Redis connected");
  });

  return redisClient;
}

// Driver location helpers using Redis GEO
export async function updateDriverLocation(driverId: string, lat: number, lng: number) {
  const redis = getRedis();
  await redis.geoadd("drivers:locations", lng, lat, driverId);
  await redis.set(`driver:${driverId}:location`, JSON.stringify({ lat, lng, updatedAt: Date.now() }), "EX", 300);
}

export async function getNearbyDrivers(lat: number, lng: number, radiusKm: number = 3): Promise<string[]> {
  const redis = getRedis();
  const results = await redis.georadius("drivers:locations", lng, lat, radiusKm, "km", "ASC", "COUNT", 20);
  return results as string[];
}

export async function removeDriverLocation(driverId: string) {
  const redis = getRedis();
  await redis.zrem("drivers:locations", driverId);
  await redis.del(`driver:${driverId}:location`);
}

export async function getDriverLocation(driverId: string): Promise<{ lat: number; lng: number } | null> {
  const redis = getRedis();
  const data = await redis.get(`driver:${driverId}:location`);
  if (!data) return null;
  const parsed = JSON.parse(data);
  return { lat: parsed.lat, lng: parsed.lng };
}

// Rate limiting
export async function checkRateLimit(key: string, maxAttempts: number, windowSeconds: number): Promise<boolean> {
  const redis = getRedis();
  const current = await redis.incr(key);
  if (current === 1) {
    await redis.expire(key, windowSeconds);
  }
  return current <= maxAttempts;
}
