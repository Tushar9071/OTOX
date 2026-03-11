import { Elysia, t } from "elysia";
import { PrismaClient } from "@prisma/client";
import { signAdminToken } from "../../middleware/adminAuth";

const prisma = new PrismaClient();

export const adminAuthRoutes = new Elysia({ prefix: "/auth" })
  .post(
    "/verify",
    async ({ body, set }) => {
      const { idToken } = body;

      let decodedToken: { uid: string; email?: string };
      try {
        const env = (await import("../../config/env")).default;
        if (env.FIREBASE_PROJECT_ID) {
          const { getFirebaseAuth } = await import("../../config/firebase");
          const auth = getFirebaseAuth();
          decodedToken = await auth.verifyIdToken(idToken);
        } else {
          decodedToken = JSON.parse(Buffer.from(idToken, "base64").toString());
        }
      } catch {
        set.status = 401;
        return { success: false, error: "Invalid token" };
      }

      const admin = await prisma.adminUser.findUnique({
        where: { firebaseUid: decodedToken.uid },
      });

      if (!admin) {
        set.status = 403;
        return { success: false, error: "Not authorized as admin" };
      }

      if (!admin.isActive) {
        set.status = 403;
        return { success: false, error: "Admin account deactivated" };
      }

      const token = await signAdminToken({
        adminId: admin.id,
        role: admin.role,
        email: admin.email,
      });

      return {
        success: true,
        data: { token, admin },
      };
    },
    {
      body: t.Object({ idToken: t.String() }),
    }
  );
