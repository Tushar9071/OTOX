import { Elysia } from "elysia";
import { bearer } from "@elysiajs/bearer";
import * as jose from "jose";
import { PrismaClient, AdminRole } from "@prisma/client";
import env from "../config/env";
import { ROLE_PERMISSIONS, type AdminJwtPayload, type Permission } from "../types";

const prisma = new PrismaClient();

export async function signAdminToken(payload: AdminJwtPayload): Promise<string> {
  const secret = new TextEncoder().encode(env.JWT_SECRET);
  return await new jose.SignJWT(payload as unknown as jose.JWTPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("8h")
    .setIssuedAt()
    .sign(secret);
}

async function verifyAdminToken(token: string): Promise<AdminJwtPayload | null> {
  try {
    const secret = new TextEncoder().encode(env.JWT_SECRET);
    const { payload } = await jose.jwtVerify(token, secret);
    return payload as unknown as AdminJwtPayload;
  } catch {
    return null;
  }
}

// Admin auth middleware
export const adminAuthMiddleware = new Elysia({ name: "admin-auth-middleware" })
  .use(bearer())
  .derive(async ({ bearer: token, set }) => {
    if (!token) {
      set.status = 401;
      throw new Error("Admin authentication required");
    }

    const payload = await verifyAdminToken(token);
    if (!payload) {
      set.status = 401;
      throw new Error("Invalid or expired admin token");
    }

    const admin = await prisma.adminUser.findUnique({
      where: { id: payload.adminId },
    });

    if (!admin || !admin.isActive) {
      set.status = 401;
      throw new Error("Admin not found or deactivated");
    }

    return { admin, adminPayload: payload };
  });

// Permission check helper
export function requirePermission(permission: Permission) {
  return (admin: { role: AdminRole }) => {
    const perms = ROLE_PERMISSIONS[admin.role];
    if (!perms.includes(permission)) {
      throw new Error(`Insufficient permissions: ${permission} required`);
    }
  };
}
