import { Elysia, t } from "elysia";
import { PrismaClient } from "@prisma/client";
import { requirePermission } from "../../middleware/adminAuth";

const prisma = new PrismaClient();

export const adminErrorsRoutes = new Elysia({ prefix: "/errors" })
  .get("/", async ({ admin, query }) => {
    requirePermission("view_errors")(admin);

    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;
    const severity = query.severity as string | undefined;
    const resolved = query.resolved as string | undefined;

    const where: any = {};
    if (severity) where.severity = severity;
    if (resolved === "true") where.resolved = true;
    if (resolved === "false") where.resolved = false;

    const [errors, total] = await Promise.all([
      prisma.serverErrorLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.serverErrorLog.count({ where }),
    ]);

    return {
      success: true,
      data: errors,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  })

  .patch(
    "/:id/resolve",
    async ({ admin, params }) => {
      requirePermission("view_errors")(admin);

      const errorLog = await prisma.serverErrorLog.update({
        where: { id: params.id },
        data: { resolved: true, resolvedBy: admin.id, resolvedAt: new Date() },
      });

      return { success: true, data: errorLog };
    }
  );
