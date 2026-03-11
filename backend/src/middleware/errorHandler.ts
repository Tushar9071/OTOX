import { Elysia } from "elysia";
import { PrismaClient } from "@prisma/client";
import { logger } from "./logger";

const prisma = new PrismaClient();

export const errorHandler = new Elysia({ name: "error-handler" })
  .onError(async ({ code, error, set, request, path }) => {
    const method = request.method;
    let statusCode = 500;
    let message = "Internal Server Error";

    switch (code) {
      case "NOT_FOUND":
        statusCode = 404;
        message = "Not Found";
        break;
      case "VALIDATION":
        statusCode = 400;
        message = error.message || "Validation Error";
        break;
      case "PARSE":
        statusCode = 400;
        message = "Invalid request body";
        break;
      default:
        statusCode = (error as any).status || 500;
        message = error.message || "Internal Server Error";
    }

    // Log to DB for server errors
    if (statusCode >= 500) {
      try {
        await prisma.serverErrorLog.create({
          data: {
            severity: "ERROR",
            endpoint: path,
            method,
            statusCode,
            message: error.message,
            stack: error.stack,
            metadata: { code } as any,
          },
        });
      } catch (dbErr) {
        logger.error({ dbErr }, "Failed to log error to database");
      }
    }

    logger.error({ statusCode, method, path, error: error.message }, "Error");
    set.status = statusCode;
    return { success: false, error: message };
  });
