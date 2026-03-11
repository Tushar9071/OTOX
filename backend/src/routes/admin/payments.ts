import { Elysia, t } from "elysia";
import { PrismaClient } from "@prisma/client";
import { requirePermission } from "../../middleware/adminAuth";

const prisma = new PrismaClient();

export const adminPaymentsRoutes = new Elysia({ prefix: "/payments" })
  .get("/", async ({ admin, query }) => {
    requirePermission("view_payments")(admin);

    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        include: {
          ride: {
            select: {
              id: true,
              pickupAddress: true,
              dropAddress: true,
              customer: { select: { name: true, phone: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.payment.count(),
    ]);

    return {
      success: true,
      data: payments,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  })

  .get("/summary", async ({ admin }) => {
    requirePermission("view_payments")(admin);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [todayRevenue, monthRevenue, totalRevenue, pendingPayouts] = await Promise.all([
      prisma.payment.aggregate({ where: { status: "PAID", createdAt: { gte: today } }, _sum: { amount: true } }),
      prisma.payment.aggregate({ where: { status: "PAID", createdAt: { gte: thisMonth } }, _sum: { amount: true } }),
      prisma.payment.aggregate({ where: { status: "PAID" }, _sum: { amount: true } }),
      prisma.earning.aggregate({ where: { isPaid: false }, _sum: { netAmount: true }, _count: true }),
    ]);

    return {
      success: true,
      data: {
        todayRevenue: todayRevenue._sum.amount || 0,
        monthRevenue: monthRevenue._sum.amount || 0,
        totalRevenue: totalRevenue._sum.amount || 0,
        pendingPayouts: pendingPayouts._sum.netAmount || 0,
        pendingPayoutCount: pendingPayouts._count,
      },
    };
  })

  .get("/driver-payouts", async ({ admin, query }) => {
    requirePermission("process_payouts")(admin);

    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const pendingByDriver = await prisma.earning.groupBy({
      by: ["driverId"],
      where: { isPaid: false },
      _sum: { netAmount: true },
      _count: true,
    });

    // Get driver details
    const driverIds = pendingByDriver.map((p) => p.driverId);
    const drivers = await prisma.driverProfile.findMany({
      where: { id: { in: driverIds } },
      include: { user: { select: { name: true, phone: true } } },
    });

    const driverMap = new Map(drivers.map((d) => [d.id, d]));
    const data = pendingByDriver.map((p) => ({
      driverId: p.driverId,
      driver: driverMap.get(p.driverId),
      pendingAmount: p._sum.netAmount || 0,
      rides: p._count,
    }));

    return { success: true, data };
  })

  .post(
    "/driver-payouts/process",
    async ({ admin, body }) => {
      requirePermission("process_payouts")(admin);

      const { payoutService } = await import("../../services/payoutService");
      const results = [];

      for (const driverId of body.driverIds) {
        const result = await payoutService.processPayout(driverId);
        results.push({ driverId, ...result });
      }

      await prisma.adminActivityLog.create({
        data: {
          adminId: admin.id,
          action: "PROCESSED_PAYOUTS",
          entity: "Earning",
          metadata: { driverIds: body.driverIds, results } as any,
        },
      });

      return { success: true, data: results, message: "Payouts processed" };
    },
    {
      body: t.Object({ driverIds: t.Array(t.String()) }),
    }
  );
