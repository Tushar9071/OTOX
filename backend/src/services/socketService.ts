import { logger } from "../middleware/logger";

// In-memory WebSocket connection maps
const customerConnections = new Map<string, Set<any>>(); // rideId -> ws connections
const driverConnections = new Map<string, any>(); // driverId -> ws connection

export const socketService = {
  // Register customer WebSocket
  addCustomerConnection(rideId: string, ws: any) {
    if (!customerConnections.has(rideId)) {
      customerConnections.set(rideId, new Set());
    }
    customerConnections.get(rideId)!.add(ws);
    logger.debug({ rideId }, "Customer WS connected");
  },

  removeCustomerConnection(rideId: string, ws: any) {
    const set = customerConnections.get(rideId);
    if (set) {
      set.delete(ws);
      if (set.size === 0) customerConnections.delete(rideId);
    }
  },

  // Register driver WebSocket
  addDriverConnection(driverId: string, ws: any) {
    driverConnections.set(driverId, ws);
    logger.debug({ driverId }, "Driver WS connected");
  },

  removeDriverConnection(driverId: string) {
    driverConnections.delete(driverId);
  },

  // Send to customer ride subscribers
  sendToCustomer(rideId: string, event: string, data: any) {
    const connections = customerConnections.get(rideId);
    if (!connections) return;

    const message = JSON.stringify({ event, data });
    for (const ws of connections) {
      try {
        ws.send(message);
      } catch {
        connections.delete(ws);
      }
    }
  },

  // Send to driver
  sendToDriver(driverId: string, event: string, data: any) {
    const ws = driverConnections.get(driverId);
    if (!ws) return;

    try {
      ws.send(JSON.stringify({ event, data }));
    } catch {
      driverConnections.delete(driverId);
    }
  },

  // Broadcast to all connected admin panels (for live map)
  adminConnections: new Set<any>(),

  addAdminConnection(ws: any) {
    this.adminConnections.add(ws);
  },

  removeAdminConnection(ws: any) {
    this.adminConnections.delete(ws);
  },

  broadcastToAdmins(event: string, data: any) {
    const message = JSON.stringify({ event, data });
    for (const ws of this.adminConnections) {
      try {
        ws.send(message);
      } catch {
        this.adminConnections.delete(ws);
      }
    }
  },

  getStats() {
    return {
      customerConnections: customerConnections.size,
      driverConnections: driverConnections.size,
      adminConnections: this.adminConnections.size,
    };
  },
};
