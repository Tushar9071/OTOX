import { Elysia } from "elysia";
import cors from "@elysiajs/cors";
import env from "../config/env";

export const corsPlugin = new Elysia({ name: "cors" }).use(
  cors({
    origin: env.CORS_ORIGINS,
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  })
);
