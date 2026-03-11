import { Elysia } from "elysia";
import { PrismaClient } from "@prisma/client";
import { payoutService } from "../../services/payoutService";

const prisma = new PrismaClient();

export const driverEarningsRoutes = new Elysia()
  .get("/earnings", async ({ user, query }) => {
    const profile = await prisma.driverProfile.findUnique({
      where: { userId: user.id },
    });

    if (!profile) return { success: true, data: null };

    const period = (query.period as "today" | "week" | "month") || "today";
    const earnings = await payoutService.getDriverEarnings(profile.id, period);

    return {
      success: true,
      data: {
        ...earnings,
        rating: profile.rating,
        totalLifetimeRides: profile.totalRides,
        totalLifetimeEarnings: profile.totalEarnings,
      },
    };
  })

  .get("/earnings/history", async ({ user, query }) => {
    const profile = await prisma.driverProfile.findUnique({
      where: { userId: user.id },
    });

    if (!profile) return { success: true, data: [] };

    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const [earnings, total] = await Promise.all([
      prisma.earning.findMany({
        where: { driverId: profile.id },
        include: { ride: { select: { pickupAddress: true, dropAddress: true, completedAt: true } } },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.earning.count({ where: { driverId: profile.id } }),
    ]);

    return {
      success: true,
      data: earnings,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  });
