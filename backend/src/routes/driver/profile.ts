import { Elysia, t } from "elysia";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const driverProfileRoutes = new Elysia()
  .get("/profile", async ({ user, set }) => {
    const profile = await prisma.driverProfile.findUnique({
      where: { userId: user.id },
      include: { vehicle: true, user: true },
    });

    if (!profile) {
      set.status = 404;
      return { success: false, error: "Driver profile not found" };
    }

    return { success: true, data: profile };
  })

  .put(
    "/profile",
    async ({ user, body, set }) => {
      let profile = await prisma.driverProfile.findUnique({
        where: { userId: user.id },
      });

      if (!profile) {
        // Create driver profile
        profile = await prisma.driverProfile.create({
          data: {
            userId: user.id,
            licenseNumber: body.licenseNumber!,
            licenseExpiry: new Date(body.licenseExpiry!),
            aadharNumber: body.aadharNumber!,
            panNumber: body.panNumber,
            bankAccountNumber: body.bankAccountNumber,
            bankIfsc: body.bankIfsc,
            upiId: body.upiId,
          },
        });
      } else {
        profile = await prisma.driverProfile.update({
          where: { userId: user.id },
          data: {
            panNumber: body.panNumber,
            bankAccountNumber: body.bankAccountNumber,
            bankIfsc: body.bankIfsc,
            upiId: body.upiId,
          },
        });
      }

      // Update user name/email if provided
      if (body.name || body.email) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            ...(body.name && { name: body.name }),
            ...(body.email && { email: body.email }),
          },
        });
      }

      const updated = await prisma.driverProfile.findUnique({
        where: { userId: user.id },
        include: { vehicle: true, user: true },
      });

      return { success: true, data: updated };
    },
    {
      body: t.Object({
        name: t.Optional(t.String()),
        email: t.Optional(t.String({ format: "email" })),
        licenseNumber: t.Optional(t.String()),
        licenseExpiry: t.Optional(t.String()),
        aadharNumber: t.Optional(t.String()),
        panNumber: t.Optional(t.String()),
        bankAccountNumber: t.Optional(t.String()),
        bankIfsc: t.Optional(t.String()),
        upiId: t.Optional(t.String()),
      }),
    }
  )

  .post(
    "/profile/vehicle",
    async ({ user, body, set }) => {
      const profile = await prisma.driverProfile.findUnique({
        where: { userId: user.id },
      });

      if (!profile) {
        set.status = 404;
        return { success: false, error: "Driver profile not found. Complete profile first." };
      }

      const existingVehicle = await prisma.vehicle.findUnique({
        where: { driverProfileId: profile.id },
      });

      let vehicle;
      if (existingVehicle) {
        vehicle = await prisma.vehicle.update({
          where: { driverProfileId: profile.id },
          data: {
            registrationNo: body.registrationNo,
            model: body.model,
            color: body.color,
            yearOfMfg: body.yearOfMfg,
            insuranceExpiry: new Date(body.insuranceExpiry),
            permitExpiry: new Date(body.permitExpiry),
            rcDocument: body.rcDocument,
            insuranceDoc: body.insuranceDoc,
          },
        });
      } else {
        vehicle = await prisma.vehicle.create({
          data: {
            driverProfileId: profile.id,
            registrationNo: body.registrationNo,
            model: body.model,
            color: body.color,
            yearOfMfg: body.yearOfMfg,
            insuranceExpiry: new Date(body.insuranceExpiry),
            permitExpiry: new Date(body.permitExpiry),
            rcDocument: body.rcDocument,
            insuranceDoc: body.insuranceDoc,
          },
        });
      }

      return { success: true, data: vehicle };
    },
    {
      body: t.Object({
        registrationNo: t.String(),
        model: t.String(),
        color: t.String(),
        yearOfMfg: t.Number(),
        insuranceExpiry: t.String(),
        permitExpiry: t.String(),
        rcDocument: t.Optional(t.String()),
        insuranceDoc: t.Optional(t.String()),
      }),
    }
  )

  .patch(
    "/status",
    async ({ user, body, set }) => {
      const profile = await prisma.driverProfile.findUnique({
        where: { userId: user.id },
      });

      if (!profile) {
        set.status = 404;
        return { success: false, error: "Driver profile not found" };
      }

      if (!profile.isApproved) {
        set.status = 403;
        return { success: false, error: "Driver not yet approved" };
      }

      const updated = await prisma.driverProfile.update({
        where: { userId: user.id },
        data: { status: body.status },
      });

      // If going offline, remove from Redis location
      if (body.status === "OFFLINE") {
        const { removeDriverLocation } = await import("../../config/redis");
        await removeDriverLocation(profile.id);
      }

      return { success: true, data: { status: updated.status } };
    },
    {
      body: t.Object({
        status: t.Union([t.Literal("ONLINE"), t.Literal("OFFLINE")]),
      }),
    }
  )

  .patch(
    "/fcm-token",
    async ({ user, body }) => {
      await prisma.driverProfile.update({
        where: { userId: user.id },
        data: { fcmToken: body.fcmToken },
      });
      return { success: true, message: "FCM token updated" };
    },
    {
      body: t.Object({ fcmToken: t.String() }),
    }
  );
