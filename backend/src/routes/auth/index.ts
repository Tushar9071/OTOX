import { Elysia, t } from "elysia";
import { PrismaClient } from "@prisma/client";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../../middleware/auth";
import { logger } from "../../middleware/logger";

const prisma = new PrismaClient();

export const authRoutes = new Elysia({ prefix: "/auth" })
  // Verify Firebase token and issue JWT
  .post(
    "/verify",
    async ({ body, set }) => {
      const { idToken } = body;

      let decodedToken: { uid: string; phone_number?: string };

      try {
        const env = (await import("../../config/env")).default;
        if (env.FIREBASE_PROJECT_ID) {
          const { getFirebaseAuth } = await import("../../config/firebase");
          const auth = getFirebaseAuth();
          decodedToken = await auth.verifyIdToken(idToken);
        } else {
          // Dev mode: accept token as JSON {uid, phone_number}
          decodedToken = JSON.parse(Buffer.from(idToken, "base64").toString());
        }
      } catch {
        set.status = 401;
        return { success: false, error: "Invalid Firebase token" };
      }

      const user = await prisma.user.findUnique({
        where: { firebaseUid: decodedToken.uid },
        include: {
          customerProfile: true,
          driverProfile: { include: { vehicle: true } },
        },
      });

      if (!user) {
        return {
          success: true,
          data: { isNewUser: true, firebaseUid: decodedToken.uid },
          message: "User not registered. Please complete registration.",
        };
      }

      if (!user.isActive) {
        set.status = 403;
        return { success: false, error: "Account is deactivated" };
      }

      const accessToken = await signAccessToken({
        userId: user.id,
        role: user.role,
        firebaseUid: user.firebaseUid,
      });

      const refreshToken = await signRefreshToken({ userId: user.id });

      return {
        success: true,
        data: { accessToken, refreshToken, user },
      };
    },
    {
      body: t.Object({ idToken: t.String() }),
    }
  )

  // Register new user
  .post(
    "/register",
    async ({ body, set }) => {
      const { idToken, name, phone, role, email } = body;

      let firebaseUid: string;

      try {
        const env = (await import("../../config/env")).default;
        if (env.FIREBASE_PROJECT_ID) {
          const { getFirebaseAuth } = await import("../../config/firebase");
          const auth = getFirebaseAuth();
          const decoded = await auth.verifyIdToken(idToken);
          firebaseUid = decoded.uid;
        } else {
          const decoded = JSON.parse(Buffer.from(idToken, "base64").toString());
          firebaseUid = decoded.uid;
        }
      } catch {
        set.status = 401;
        return { success: false, error: "Invalid Firebase token" };
      }

      // Check if user already exists
      const existing = await prisma.user.findUnique({ where: { firebaseUid } });
      if (existing) {
        set.status = 409;
        return { success: false, error: "User already registered" };
      }

      // Validate phone uniqueness
      const phoneExists = await prisma.user.findUnique({ where: { phone } });
      if (phoneExists) {
        set.status = 409;
        return { success: false, error: "Phone number already registered" };
      }

      // Generate referral code
      const referralCode = `AR${phone.slice(-4)}${Date.now().toString(36).slice(-4).toUpperCase()}`;

      const user = await prisma.user.create({
        data: {
          firebaseUid,
          phone,
          name,
          email: email || null,
          role,
          referralCode,
          customerProfile: role === "CUSTOMER" ? { create: {} } : undefined,
        },
        include: {
          customerProfile: true,
          driverProfile: true,
        },
      });

      const accessToken = await signAccessToken({
        userId: user.id,
        role: user.role,
        firebaseUid: user.firebaseUid,
      });

      const refreshToken = await signRefreshToken({ userId: user.id });

      logger.info({ userId: user.id, role }, "New user registered");

      return {
        success: true,
        data: { accessToken, refreshToken, user },
        message: "Registration successful",
      };
    },
    {
      body: t.Object({
        idToken: t.String(),
        name: t.String({ minLength: 2 }),
        phone: t.String({ pattern: "^[6-9]\\d{9}$" }),
        role: t.Union([t.Literal("CUSTOMER"), t.Literal("DRIVER")]),
        email: t.Optional(t.String({ format: "email" })),
      }),
    }
  )

  // Refresh token
  .post(
    "/refresh",
    async ({ body, set }) => {
      const { refreshToken } = body;
      const payload = await verifyRefreshToken(refreshToken);

      if (!payload) {
        set.status = 401;
        return { success: false, error: "Invalid refresh token" };
      }

      const user = await prisma.user.findUnique({ where: { id: payload.userId } });
      if (!user || !user.isActive) {
        set.status = 401;
        return { success: false, error: "User not found or deactivated" };
      }

      const accessToken = await signAccessToken({
        userId: user.id,
        role: user.role,
        firebaseUid: user.firebaseUid,
      });

      const newRefreshToken = await signRefreshToken({ userId: user.id });

      return {
        success: true,
        data: { accessToken, refreshToken: newRefreshToken },
      };
    },
    {
      body: t.Object({ refreshToken: t.String() }),
    }
  );
