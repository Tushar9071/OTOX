import pino from "pino";
import env from "../config/env";

export const logger = pino({
  level: env.NODE_ENV === "production" ? "info" : "debug",
  transport: env.NODE_ENV === "development" ? { target: "pino-pretty", options: { colorize: true } } : undefined,
});

export function requestLogger() {
  return (context: { request: Request; set: { status?: number }; path: string }) => {
    const start = Date.now();
    const { method, url } = context.request;
    logger.info({ method, url: context.path }, "→ Request");
    return () => {
      const duration = Date.now() - start;
      logger.info({ method, url: context.path, status: context.set.status, duration: `${duration}ms` }, "← Response");
    };
  };
}
