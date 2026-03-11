import { Elysia, t } from "elysia";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const customerProfileRoutes = new Elysia()
  .get("/profile", async ({ user }) => {
    return {
      success: true,
      data: user,
    };
  })

  .put(
    "/profile",
    async ({ user, body }) => {
      const updated = await prisma.user.update({
        where: { id: user.id },
        data: {
          name: body.name,
          email: body.email,
          avatar: body.avatar,
        },
        include: { customerProfile: true },
      });
      return { success: true, data: updated };
    },
    {
      body: t.Object({
        name: t.Optional(t.String({ minLength: 2 })),
        email: t.Optional(t.String({ format: "email" })),
        avatar: t.Optional(t.String()),
      }),
    }
  )

  .get("/addresses", async ({ user }) => {
    const addresses = await prisma.savedAddress.findMany({
      where: { customerProfile: { userId: user.id } },
      orderBy: { createdAt: "desc" },
    });
    return { success: true, data: addresses };
  })

  .post(
    "/addresses",
    async ({ user, body, set }) => {
      const profile = await prisma.customerProfile.findUnique({
        where: { userId: user.id },
      });
      if (!profile) {
        set.status = 404;
        return { success: false, error: "Customer profile not found" };
      }

      const address = await prisma.savedAddress.create({
        data: {
          customerProfileId: profile.id,
          label: body.label,
          address: body.address,
          latitude: body.latitude,
          longitude: body.longitude,
        },
      });
      return { success: true, data: address };
    },
    {
      body: t.Object({
        label: t.String({ minLength: 1 }),
        address: t.String({ minLength: 1 }),
        latitude: t.Number(),
        longitude: t.Number(),
      }),
    }
  )

  .delete("/addresses/:id", async ({ user, params, set }) => {
    const address = await prisma.savedAddress.findFirst({
      where: { id: params.id, customerProfile: { userId: user.id } },
    });

    if (!address) {
      set.status = 404;
      return { success: false, error: "Address not found" };
    }

    await prisma.savedAddress.delete({ where: { id: params.id } });
    return { success: true, message: "Address deleted" };
  })

  .get("/notifications", async ({ user, query }) => {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where: { userId: user.id } }),
    ]);

    return {
      success: true,
      data: notifications,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  })

  .patch("/notifications/:id/read", async ({ user, params, set }) => {
    const notification = await prisma.notification.findFirst({
      where: { id: params.id, userId: user.id },
    });

    if (!notification) {
      set.status = 404;
      return { success: false, error: "Notification not found" };
    }

    await prisma.notification.update({
      where: { id: params.id },
      data: { isRead: true },
    });

    return { success: true, message: "Marked as read" };
  });
