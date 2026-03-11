import { Elysia } from "elysia";
import { bearer } from "@elysiajs/bearer";
import * as jose from "jose";
import { PrismaClient } from "@prisma/client";
import env from "../config/env";
import type { JwtPayload } from "../types";

const prisma = new PrismaClient();

async function verifyAccessToken(token: string): Promise<JwtPayload | null> {
  try {
    const secret = new TextEncoder().encode(env.JWT_SECRET);
    const { payload } = await jose.jwtVerify(token, secret);
    return payload as unknown as JwtPayload;
  } catch {
    return null;
  }
}

export async function signAccessToken(payload: JwtPayload): Promise<string> {
  const secret = new TextEncoder().encode(env.JWT_SECRET);
  return await new jose.SignJWT(payload as unknown as jose.JWTPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(env.JWT_EXPIRES_IN)
    .setIssuedAt()
    .sign(secret);
}

export async function signRefreshToken(payload: { userId: string }): Promise<string> {
  const secret = new TextEncoder().encode(env.JWT_REFRESH_SECRET);
  return await new jose.SignJWT(payload as unknown as jose.JWTPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(env.JWT_REFRESH_EXPIRES_IN)
    .setIssuedAt()
    .sign(secret);
}

export async function verifyRefreshToken(token: string): Promise<{ userId: string } | null> {
  try {
    const secret = new TextEncoder().encode(env.JWT_REFRESH_SECRET);
    const { payload } = await jose.jwtVerify(token, secret);
    return payload as unknown as { userId: string };
  } catch {
    return null;
  }
}

// User auth middleware for customer/driver routes
export const authMiddleware = new Elysia({ name: "auth-middleware" })
  .use(bearer())
  .derive(async ({ bearer: token, set }) => {
    if (!token) {
      set.status = 401;
      throw new Error("Authentication required");
    }

    const payload = await verifyAccessToken(token);
    if (!payload) {
      set.status = 401;
      throw new Error("Invalid or expired token");
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { customerProfile: true, driverProfile: { include: { vehicle: true } } },
    });

    if (!user || !user.isActive) {
      set.status = 401;
      throw new Error("User not found or deactivated");
    }

    return { user, jwtPayload: payload };
  });
