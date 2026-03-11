import { io, Socket } from "socket.io-client";
import { useRideStore } from "@/stores/rideStore";
import { useLocationStore } from "@/stores/locationStore";

const WS_URL = process.env.EXPO_PUBLIC_WS_URL || "ws://localhost:3001";

class SocketService {
  private socket: Socket | null = null;

  connect(type: "customer" | "driver", id: string) {
    const path = type === "customer" ? `/ws/customer/${id}` : `/ws/driver/${id}`;
    this.socket = io(WS_URL, { path, transports: ["websocket"] });

    this.socket.on("connect", () => {
      console.log(`[WS] Connected as ${type}`);
    });

    this.socket.on("disconnect", () => {
      console.log("[WS] Disconnected");
    });

    if (type === "customer") {
      this.setupCustomerListeners();
    } else {
      this.setupDriverListeners();
    }
  }

  private setupCustomerListeners() {
    if (!this.socket) return;

    this.socket.on("ride:accepted", (data) => {
      useRideStore.getState().setActiveRide({
        ...useRideStore.getState().activeRide,
        status: "ACCEPTED",
        driver: data.driver,
      });
    });

    this.socket.on("ride:arrived", () => {
      useRideStore.getState().updateRideStatus("ARRIVED");
    });

    this.socket.on("ride:started", () => {
      useRideStore.getState().updateRideStatus("IN_PROGRESS");
    });

    this.socket.on("ride:completed", (data) => {
      useRideStore.getState().setActiveRide({
        ...useRideStore.getState().activeRide,
        status: "COMPLETED",
        finalFare: data.finalFare,
      });
    });

    this.socket.on("driver:location", (data) => {
      useLocationStore.getState().setDriverLocation({
        latitude: data.lat,
        longitude: data.lng,
      });
    });
  }

  private setupDriverListeners() {
    if (!this.socket) return;

    this.socket.on("ride:new", (data) => {
      useRideStore.getState().addRideRequest(data);
    });

    this.socket.on("ride:cancelled", () => {
      useRideStore.getState().clearActiveRide();
    });
  }

  sendLocation(lat: number, lng: number) {
    this.socket?.emit("location:update", { lat, lng });
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }
}

export const socketService = new SocketService();
