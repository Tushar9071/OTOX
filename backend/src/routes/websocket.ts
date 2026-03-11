import { Elysia } from "elysia";
import { socketService } from "../services/socketService";
import { logger } from "../middleware/logger";

export const websocketRoutes = new Elysia()
  // Customer WebSocket — subscribe to ride updates
  .ws("/ws/customer/:rideId", {
    open(ws) {
      const rideId = (ws.data as any).params.rideId;
      socketService.addCustomerConnection(rideId, ws);
      logger.debug({ rideId }, "Customer WS opened");
    },
    close(ws) {
      const rideId = (ws.data as any).params.rideId;
      socketService.removeCustomerConnection(rideId, ws);
      logger.debug({ rideId }, "Customer WS closed");
    },
    message(ws, message) {
      // Customer doesn't need to send messages, but handle ping
    },
  })

  // Driver WebSocket — receive ride requests + send location
  .ws("/ws/driver/:driverId", {
    open(ws) {
      const driverId = (ws.data as any).params.driverId;
      socketService.addDriverConnection(driverId, ws);
      logger.debug({ driverId }, "Driver WS opened");
    },
    close(ws) {
      const driverId = (ws.data as any).params.driverId;
      socketService.removeDriverConnection(driverId);
      logger.debug({ driverId }, "Driver WS closed");
    },
    message(ws, message) {
      try {
        const data = typeof message === "string" ? JSON.parse(message) : message;
        if (data.event === "driver:location_update") {
          const driverId = (ws.data as any).params.driverId;
          // Update location in Redis
          import("../config/redis").then(({ updateDriverLocation }) => {
            updateDriverLocation(driverId, data.data.lat, data.data.lng);
          });
        }
      } catch {
        // Ignore invalid messages
      }
    },
  })

  // Admin WebSocket — live map updates
  .ws("/ws/admin", {
    open(ws) {
      socketService.addAdminConnection(ws);
      logger.debug("Admin WS opened");
    },
    close(ws) {
      socketService.removeAdminConnection(ws);
      logger.debug("Admin WS closed");
    },
    message(ws, message) {
      // Admin panel doesn't send messages
    },
  });
