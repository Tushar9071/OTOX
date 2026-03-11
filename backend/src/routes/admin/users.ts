import { Elysia, t } from "elysia";
import { PrismaClient } from "@prisma/client";
import { requirePermission } from "../../middleware/adminAuth";

const prisma = new PrismaClient();

export const adminUsersRoutes = new Elysia({ prefix: "/users" })
  .get("/", async ({ admin, query }) => {
    requirePermission("view_dashboard")(admin);

    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;
    const search = query.search as string | undefined;

    const where: any = { role: "CUSTOMER" };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { phone: { contains: search } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: { customerProfile: true },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return {
      success: true,
      data: users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  })

  .get("/:id", async ({ admin, params }) => {
    requirePermission("view_dashboard")(admin);

    const user = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        customerProfile: { include: { savedAddresses: true } },
        ridesAsCustomer: { orderBy: { createdAt: "desc" }, take: 10 },
        wallet: { orderBy: { createdAt: "desc" }, take: 20 },
      },
    });

    if (!user) return { success: false, error: "User not found" };
    return { success: true, data: user };
  })

  .patch(
    "/:id/status",
    async ({ admin, params, body }) => {
      requirePermission("ban_users")(admin);

      const user = await prisma.user.update({
        where: { id: params.id },
        data: { isActive: body.isActive },
      });

      // Log activity
      await prisma.adminActivityLog.create({
        data: {
          adminId: admin.id,
          action: body.isActive ? "UNBAN_USER" : "BAN_USER",
          entity: "User",
          entityId: params.id,
        },
      });

      return { success: true, data: user };
    },
    { body: t.Object({ isActive: t.Boolean() }) }
  )

  .get("/:id/rides", async ({ admin, params, query }) => {
    requirePermission("view_rides")(admin);

    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const [rides, total] = await Promise.all([
      prisma.ride.findMany({
        where: { customerId: params.id },
        include: { driver: { include: { user: { select: { name: true } } } } },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.ride.count({ where: { customerId: params.id } }),
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
