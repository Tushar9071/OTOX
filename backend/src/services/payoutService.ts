import { PrismaClient } from "@prisma/client";
import env from "../config/env";
import { logger } from "../middleware/logger";

const prisma = new PrismaClient();

export const payoutService = {
  async calculateEarning(rideId: string, finalFare: number, driverId: string) {
    const commissionPercent = env.PLATFORM_COMMISSION_PERCENT;
    const commission = (finalFare * commissionPercent) / 100;
    const netAmount = finalFare - commission;

    const earning = await prisma.earning.create({
      data: {
        driverId,
        rideId,
        grossAmount: finalFare,
        commission,
        netAmount,
      },
    });

    // Update driver totals
    await prisma.driverProfile.update({
      where: { id: driverId },
      data: {
        totalEarnings: { increment: netAmount },
      },
    });

    return earning;
  },

  async getDriverEarnings(driverId: string, period: "today" | "week" | "month") {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case "today":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case "week":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
    }

    const earnings = await prisma.earning.aggregate({
      where: {
        driverId,
        createdAt: { gte: startDate },
      },
      _sum: { grossAmount: true, commission: true, netAmount: true },
      _count: true,
    });

    return {
      totalRides: earnings._count,
      grossAmount: earnings._sum.grossAmount || 0,
      commission: earnings._sum.commission || 0,
      netAmount: earnings._sum.netAmount || 0,
    };
  },

  async processPayout(driverId: string) {
    const unpaid = await prisma.earning.findMany({
      where: { driverId, isPaid: false },
    });

    if (unpaid.length === 0) return null;

    const totalPayout = unpaid.reduce((sum, e) => sum + e.netAmount, 0);

    // Mark all as paid
    await prisma.earning.updateMany({
      where: {
        id: { in: unpaid.map((e) => e.id) },
      },
      data: { isPaid: true, paidAt: new Date() },
    });

    logger.info({ driverId, totalPayout, rides: unpaid.length }, "Payout processed");
    return { totalPayout, rides: unpaid.length };
  },
};
