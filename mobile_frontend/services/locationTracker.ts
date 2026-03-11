import * as Location from "expo-location";
import api from "./api";
import { socketService } from "./socket";
import { useLocationStore } from "@/stores/locationStore";

class LocationTracker {
  private watchId: Location.LocationSubscription | null = null;
  private dbUpdateTimer: NodeJS.Timeout | null = null;
  private lastDbUpdate = 0;

  async requestPermissions(): Promise<boolean> {
    const { status: foreground } = await Location.requestForegroundPermissionsAsync();
    if (foreground !== "granted") return false;

    const { status: background } = await Location.requestBackgroundPermissionsAsync();
    return background === "granted";
  }

  async getCurrentLocation() {
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });
    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
  }

  async startTracking(driverId: string) {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) return;

    this.watchId = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        distanceInterval: 10, // meters
        timeInterval: 5000, // 5 seconds
      },
      (location) => {
        const { latitude, longitude } = location.coords;

        // Update store
        useLocationStore.getState().setCurrentLocation({ latitude, longitude });

        // Send via WebSocket (real-time, every update)
        socketService.sendLocation(latitude, longitude);

        // Send to API (debounced, every 30s)
        const now = Date.now();
        if (now - this.lastDbUpdate > 30000) {
          this.lastDbUpdate = now;
          api.post("/driver/location", { latitude, longitude }).catch(() => {});
        }
      }
    );
  }

  stopTracking() {
    this.watchId?.remove();
    this.watchId = null;
    if (this.dbUpdateTimer) {
      clearInterval(this.dbUpdateTimer);
      this.dbUpdateTimer = null;
    }
  }
}

export const locationTracker = new LocationTracker();
