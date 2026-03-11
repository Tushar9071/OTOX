import { Elysia, t } from "elysia";
import { PrismaClient } from "@prisma/client";
import { requirePermission } from "../../middleware/adminAuth";

const prisma = new PrismaClient();

export const adminRolesRoutes = new Elysia({ prefix: "/roles" })
  .get("/admins", async ({ admin }) => {
    requirePermission("manage_admins")(admin);

    const admins = await prisma.adminUser.findMany({
      orderBy: { createdAt: "desc" },
    });

    return { success: true, data: admins };
  })

  .post(
    "/admins",
    async ({ admin, body, set }) => {
      requirePermission("manage_admins")(admin);

      // Check if admin already exists
      const existing = await prisma.adminUser.findUnique({ where: { email: body.email } });
      if (existing) {
        set.status = 409;
        return { success: false, error: "Admin with this email already exists" };
      }

      const newAdmin = await prisma.adminUser.create({
        data: {
          firebaseUid: body.firebaseUid,
          email: body.email,
          name: body.name,
          role: body.role as any,
        },
      });

      await prisma.adminActivityLog.create({
        data: {
          adminId: admin.id,
          action: "CREATED_ADMIN",
          entity: "AdminUser",
          entityId: newAdmin.id,
          metadata: { role: body.role } as any,
        },
      });

      return { success: true, data: newAdmin };
    },
    {
      body: t.Object({
        firebaseUid: t.String(),
        email: t.String({ format: "email" }),
        name: t.String({ minLength: 2 }),
        role: t.String(),
      }),
    }
  )

  .patch(
    "/admins/:id",
    async ({ admin, params, body }) => {
      requirePermission("manage_admins")(admin);

      const updated = await prisma.adminUser.update({
        where: { id: params.id },
        data: {
          ...(body.role && { role: body.role as any }),
          ...(body.isActive !== undefined && { isActive: body.isActive }),
          ...(body.permissions && { permissions: body.permissions }),
        },
      });

      await prisma.adminActivityLog.create({
        data: {
          adminId: admin.id,
          action: "UPDATED_ADMIN",
          entity: "AdminUser",
          entityId: params.id,
          metadata: body as any,
        },
      });

      return { success: true, data: updated };
    },
    {
      body: t.Object({
        role: t.Optional(t.String()),
        isActive: t.Optional(t.Boolean()),
        permissions: t.Optional(t.Any()),
      }),
    }
  )

  .delete("/admins/:id", async ({ admin, params, set }) => {
    requirePermission("manage_admins")(admin);

    if (params.id === admin.id) {
      set.status = 400;
      return { success: false, error: "Cannot delete yourself" };
    }

    await prisma.adminUser.delete({ where: { id: params.id } });

    await prisma.adminActivityLog.create({
      data: {
        adminId: admin.id,
        action: "DELETED_ADMIN",
        entity: "AdminUser",
        entityId: params.id,
      },
    });

    return { success: true, message: "Admin deleted" };
  })

  .get("/activity", async ({ admin, query }) => {
    requirePermission("view_activity_logs")(admin);

    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 50;
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      prisma.adminActivityLog.findMany({
        include: { admin: { select: { name: true, email: true, role: true } } },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.adminActivityLog.count(),
    ]);

    return {
      success: true,
      data: logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  });
