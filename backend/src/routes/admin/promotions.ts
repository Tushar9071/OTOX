import { Elysia, t } from "elysia";
import { PrismaClient } from "@prisma/client";
import { requirePermission } from "../../middleware/adminAuth";

const prisma = new PrismaClient();

export const adminPromotionsRoutes = new Elysia({ prefix: "/promotions" })
  .get("/", async ({ admin, query }) => {
    requirePermission("manage_promotions")(admin);

    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const [promos, total] = await Promise.all([
      prisma.promotion.findMany({ orderBy: { createdAt: "desc" }, skip, take: limit }),
      prisma.promotion.count(),
    ]);

    return {
      success: true,
      data: promos,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  })

  .post(
    "/",
    async ({ admin, body }) => {
      requirePermission("manage_promotions")(admin);

      const promo = await prisma.promotion.create({
        data: {
          code: body.code.toUpperCase(),
          description: body.description,
          discountType: body.discountType,
          discountValue: body.discountValue,
          maxDiscount: body.maxDiscount,
          minRideAmount: body.minRideAmount,
          usageLimit: body.usageLimit,
          validFrom: new Date(body.validFrom),
          validTo: new Date(body.validTo),
        },
      });

      await prisma.adminActivityLog.create({
        data: {
          adminId: admin.id,
          action: "CREATED_PROMOTION",
          entity: "Promotion",
          entityId: promo.id,
        },
      });

      return { success: true, data: promo };
    },
    {
      body: t.Object({
        code: t.String({ minLength: 3 }),
        description: t.String(),
        discountType: t.Union([t.Literal("FLAT"), t.Literal("PERCENT")]),
        discountValue: t.Number({ minimum: 0 }),
        maxDiscount: t.Optional(t.Number()),
        minRideAmount: t.Optional(t.Number()),
        usageLimit: t.Optional(t.Number()),
        validFrom: t.String(),
        validTo: t.String(),
      }),
    }
  )

  .patch(
    "/:id",
    async ({ admin, params, body }) => {
      requirePermission("manage_promotions")(admin);

      const promo = await prisma.promotion.update({
        where: { id: params.id },
        data: {
          ...(body.description && { description: body.description }),
          ...(body.discountValue !== undefined && { discountValue: body.discountValue }),
          ...(body.isActive !== undefined && { isActive: body.isActive }),
          ...(body.validTo && { validTo: new Date(body.validTo) }),
        },
      });

      return { success: true, data: promo };
    },
    {
      body: t.Object({
        description: t.Optional(t.String()),
        discountValue: t.Optional(t.Number()),
        isActive: t.Optional(t.Boolean()),
        validTo: t.Optional(t.String()),
      }),
    }
  )

  .delete("/:id", async ({ admin, params }) => {
    requirePermission("manage_promotions")(admin);

    await prisma.promotion.delete({ where: { id: params.id } });

    await prisma.adminActivityLog.create({
      data: {
        adminId: admin.id,
        action: "DELETED_PROMOTION",
        entity: "Promotion",
        entityId: params.id,
      },
    });

    return { success: true, message: "Promotion deleted" };
  });
