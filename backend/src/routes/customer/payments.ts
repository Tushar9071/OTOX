import { Elysia, t } from "elysia";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const customerPaymentRoutes = new Elysia()
  .get("/wallet", async ({ user }) => {
    const transactions = await prisma.walletTransaction.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return {
      success: true,
      data: {
        balance: user.walletBalance,
        transactions,
      },
    };
  })

  .post(
    "/wallet/topup",
    async ({ user, body, set }) => {
      // In production, create Razorpay order and return order_id
      // For now, direct topup
      const env = (await import("../../config/env")).default;

      if (env.RAZORPAY_KEY_ID) {
        try {
          const Razorpay = (await import("razorpay")).default;
          const razorpay = new Razorpay({
            key_id: env.RAZORPAY_KEY_ID,
            key_secret: env.RAZORPAY_KEY_SECRET,
          });

          const order = await razorpay.orders.create({
            amount: body.amount * 100, // Razorpay uses paise
            currency: "INR",
            receipt: `wallet_${user.id}_${Date.now()}`,
          });

          return {
            success: true,
            data: {
              orderId: order.id,
              amount: body.amount,
              currency: "INR",
              key: env.RAZORPAY_KEY_ID,
            },
          };
        } catch (err) {
          set.status = 500;
          return { success: false, error: "Payment gateway error" };
        }
      }

      // Dev mode: direct topup
      await prisma.user.update({
        where: { id: user.id },
        data: { walletBalance: { increment: body.amount } },
      });

      await prisma.walletTransaction.create({
        data: {
          userId: user.id,
          amount: body.amount,
          type: "CREDIT",
          description: `Wallet topup of ₹${body.amount}`,
        },
      });

      return {
        success: true,
        data: { balance: user.walletBalance + body.amount },
        message: `₹${body.amount} added to wallet`,
      };
    },
    {
      body: t.Object({
        amount: t.Number({ minimum: 10, maximum: 10000 }),
      }),
    }
  );
