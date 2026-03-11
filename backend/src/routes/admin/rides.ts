import { Elysia, t } from "elysia";
import { PrismaClient } from "@prisma/client";
import { requirePermission } from "../../middleware/adminAuth";

const prisma = new PrismaClient();

export const adminRidesRoutes = new Elysia({ prefix: "/rides" })
  .get("/", async ({ admin, query }) => {
    requirePermission("view_rides")(admin);

    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;
    const status = query.status as string | undefined;

    const where: any = {};
    if (status) where.status = status;

    const [rides, total] = await Promise.all([
      prisma.ride.findMany({
        where,
        include: {
          customer: { select: { name: true, phone: true } },
          driver: { include: { user: { select: { name: true, phone: true } }, vehicle: true } },
          payment: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.ride.count({ where }),
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

  .get("/:id", async ({ admin, params }) => {
    requirePermission("view_rides")(admin);

    const ride = await prisma.ride.findUnique({
      where: { id: params.id },
      include: {
        customer: true,
        driver: { include: { user: true, vehicle: true } },
        payment: true,
        review: true,
        driverEarning: true,
      },
    });

    if (!ride) return { success: false, error: "Ride not found" };
    return { success: true, data: ride };
  })

  .post(
    "/:id/refund",
    async ({ admin, params, body, set }) => {
      requirePermission("issue_refunds")(admin);

      const ride = await prisma.ride.findUnique({
        where: { id: params.id },
        include: { payment: true },
      });

      if (!ride || !ride.payment) {
        set.status = 404;
        return { success: false, error: "Ride or payment not found" };
      }

      const refundAmount = body.amount || ride.payment.amount;

      await prisma.payment.update({
        where: { id: ride.payment.id },
        data: { status: "REFUNDED" },
      });

      // Credit to customer wallet
      await prisma.user.update({
        where: { id: ride.customerId },
        data: { walletBalance: { increment: refundAmount } },
      });

      await prisma.walletTransaction.create({
        data: {
          userId: ride.customerId,
          amount: refundAmount,
          type: "CREDIT",
          description: `Refund for ride ${ride.id}`,
        },
      });

      await prisma.adminActivityLog.create({
        data: {
          adminId: admin.id,
          action: "ISSUED_REFUND",
          entity: "Ride",
          entityId: params.id,
          metadata: { amount: refundAmount } as any,
        },
      });

      return { success: true, message: `Refund of ₹${refundAmount} issued` };
    },
    {
      body: t.Object({ amount: t.Optional(t.Number({ minimum: 0 })) }),
    }
  );
