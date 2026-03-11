import { Elysia, t } from "elysia";
import { PrismaClient } from "@prisma/client";
import { requirePermission } from "../../middleware/adminAuth";

const prisma = new PrismaClient();

export const adminDriversRoutes = new Elysia({ prefix: "/drivers" })
  .get("/", async ({ admin, query }) => {
    requirePermission("view_dashboard")(admin);

    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;
    const status = query.status as string | undefined;
    const search = query.search as string | undefined;

    const where: any = {};
    if (status === "pending") where.isApproved = false;
    else if (status === "approved") where.isApproved = true;

    if (search) {
      where.user = {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { phone: { contains: search } },
        ],
      };
    }

    const [drivers, total] = await Promise.all([
      prisma.driverProfile.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, phone: true, email: true, isActive: true, createdAt: true } },
          vehicle: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.driverProfile.count({ where }),
    ]);

    return {
      success: true,
      data: drivers,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  })

  .get("/:id", async ({ admin, params }) => {
    requirePermission("view_dashboard")(admin);

    const driver = await prisma.driverProfile.findUnique({
      where: { id: params.id },
      include: {
        user: true,
        vehicle: true,
        rides: { orderBy: { createdAt: "desc" }, take: 10, include: { customer: { select: { name: true } } } },
        earnings: { orderBy: { createdAt: "desc" }, take: 20 },
      },
    });

    if (!driver) return { success: false, error: "Driver not found" };
    return { success: true, data: driver };
  })

  .patch(
    "/:id/approve",
    async ({ admin, params }) => {
      requirePermission("approve_drivers")(admin);

      const driver = await prisma.driverProfile.update({
        where: { id: params.id },
        data: { isApproved: true, isDocumentVerified: true },
        include: { user: true },
      });

      await prisma.adminActivityLog.create({
        data: {
          adminId: admin.id,
          action: "APPROVED_DRIVER",
          entity: "DriverProfile",
          entityId: params.id,
        },
      });

      return { success: true, data: driver, message: "Driver approved" };
    }
  )

  .patch(
    "/:id/reject",
    async ({ admin, params, body }) => {
      requirePermission("approve_drivers")(admin);

      const driver = await prisma.driverProfile.update({
        where: { id: params.id },
        data: { isApproved: false },
      });

      await prisma.adminActivityLog.create({
        data: {
          adminId: admin.id,
          action: "REJECTED_DRIVER",
          entity: "DriverProfile",
          entityId: params.id,
          metadata: { reason: body.reason } as any,
        },
      });

      return { success: true, data: driver, message: "Driver rejected" };
    },
    { body: t.Object({ reason: t.String() }) }
  )

  .patch(
    "/:id/status",
    async ({ admin, params, body }) => {
      requirePermission("ban_users")(admin);

      await prisma.user.update({
        where: { id: body.userId },
        data: { isActive: body.isActive },
      });

      await prisma.adminActivityLog.create({
        data: {
          adminId: admin.id,
          action: body.isActive ? "ACTIVATED_DRIVER" : "SUSPENDED_DRIVER",
          entity: "DriverProfile",
          entityId: params.id,
        },
      });

      return { success: true, message: body.isActive ? "Driver activated" : "Driver suspended" };
    },
    {
      body: t.Object({
        userId: t.String(),
        isActive: t.Boolean(),
      }),
    }
  )

  .get("/:id/earnings", async ({ admin, params, query }) => {
    requirePermission("view_payments")(admin);

    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const [earnings, total] = await Promise.all([
      prisma.earning.findMany({
        where: { driverId: params.id },
        include: { ride: { select: { pickupAddress: true, dropAddress: true, completedAt: true } } },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.earning.count({ where: { driverId: params.id } }),
    ]);

    return {
      success: true,
      data: earnings,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  })

  .get("/:id/rides", async ({ admin, params, query }) => {
    requirePermission("view_rides")(admin);

    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const [rides, total] = await Promise.all([
      prisma.ride.findMany({
        where: { driverId: params.id },
        include: { customer: { select: { name: true, phone: true } } },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.ride.count({ where: { driverId: params.id } }),
    ]);

    return {
      success: true,
      data: rides,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  });
