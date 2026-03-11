import { Elysia, t } from "elysia";
import { PrismaClient } from "@prisma/client";
import { requirePermission } from "../../middleware/adminAuth";

const prisma = new PrismaClient();

export const adminSettingsRoutes = new Elysia({ prefix: "/settings" })
  .get("/fare-config", async ({ admin }) => {
    requirePermission("view_dashboard")(admin);

    const config = await prisma.fareConfig.findFirst({ where: { isActive: true } });
    return { success: true, data: config };
  })

  .put(
    "/fare-config",
    async ({ admin, body }) => {
      requirePermission("update_fare")(admin);

      // Deactivate all existing
      await prisma.fareConfig.updateMany({ data: { isActive: false } });

      const config = await prisma.fareConfig.create({
        data: {
          baseFare: body.baseFare,
          perKmRate: body.perKmRate,
          perMinuteRate: body.perMinuteRate,
          nightCharge: body.nightCharge,
          surgeMultiplier: body.surgeMultiplier,
          isActive: true,
        },
      });

      await prisma.adminActivityLog.create({
        data: {
          adminId: admin.id,
          action: "UPDATED_FARE_CONFIG",
          entity: "FareConfig",
          entityId: config.id,
          metadata: body as any,
        },
      });

      return { success: true, data: config };
    },
    {
      body: t.Object({
        baseFare: t.Number({ minimum: 0 }),
        perKmRate: t.Number({ minimum: 0 }),
        perMinuteRate: t.Number({ minimum: 0 }),
        nightCharge: t.Number({ minimum: 1 }),
        surgeMultiplier: t.Number({ minimum: 1 }),
      }),
    }
  )

  .get("/app-settings", async ({ admin }) => {
    requirePermission("view_dashboard")(admin);

    const settings = await prisma.appSettings.findMany();
    return { success: true, data: settings };
  })

  .put(
    "/app-settings",
    async ({ admin, body }) => {
      requirePermission("update_fare")(admin);

      for (const { key, value, description } of body.settings) {
        await prisma.appSettings.upsert({
          where: { key },
          update: { value, description },
          create: { key, value, description },
        });
      }

      return { success: true, message: "Settings updated" };
    },
    {
      body: t.Object({
        settings: t.Array(
          t.Object({
            key: t.String(),
            value: t.String(),
            description: t.Optional(t.String()),
          })
        ),
      }),
    }
  );
