import { Elysia } from "elysia";
import { swaggerPlugin } from "./plugins/swagger";
import { corsPlugin } from "./plugins/cors";
import { errorHandler } from "./middleware/errorHandler";
import { authRoutes } from "./routes/auth";
import { customerRoutes } from "./routes/customer";
import { driverRoutes } from "./routes/driver";
import { mapsRoutes } from "./routes/maps";
import { adminRoutes } from "./routes/admin";
import { websocketRoutes } from "./routes/websocket";
import { logger } from "./middleware/logger";
import env from "./config/env";

const app = new Elysia()
  .use(corsPlugin)
  .use(swaggerPlugin)
  .use(errorHandler)

  // Health check
  .get("/", () => ({
    name: "AutoRiksha API",
    version: "1.0.0",
    status: "running",
    timestamp: new Date().toISOString(),
  }))

  .get("/health", () => ({ status: "ok" }))

  // API routes
  .group("/api", (app) =>
    app
      .use(authRoutes)
      .use(customerRoutes)
      .use(driverRoutes)
      .use(mapsRoutes)
      .use(adminRoutes)
  )

  // WebSocket routes
  .use(websocketRoutes)

  .listen(env.PORT);

logger.info(`🛺 AutoRiksha API running at http://localhost:${env.PORT}`);
logger.info(`📚 Swagger docs at http://localhost:${env.PORT}/swagger`);

export type App = typeof app;
