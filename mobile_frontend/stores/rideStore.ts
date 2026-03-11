import { create } from "zustand";
import api from "@/services/api";

interface RideRequest {
  id: string;
  pickupAddress: string;
  dropAddress: string;
  estimatedFare: number;
  distance: number;
  customerName: string;
}

interface ActiveRide {
  id: string;
  status: string;
  pickupLat: number;
  pickupLng: number;
  dropLat: number;
  dropLng: number;
  pickupAddress: string;
  dropAddress: string;
  estimatedFare: number;
  finalFare?: number;
  otp?: string;
  driver?: any;
  customer?: any;
  distance?: number;
  duration?: number;
}

interface RideState {
  activeRide: ActiveRide | null;
  rideRequests: RideRequest[];
  estimatedFare: number | null;
  isBooking: boolean;

  // Customer actions
  getEstimate: (pickup: any, drop: any) => Promise<any>;
  bookRide: (data: any) => Promise<void>;
  cancelRide: (rideId: string) => Promise<void>;
  rateRide: (rideId: string, rating: number, review?: string) => Promise<void>;

  // Driver actions
  acceptRide: (rideId: string) => Promise<void>;
  rejectRide: (rideId: string) => Promise<void>;
  arrivedAtPickup: (rideId: string) => Promise<void>;
  startTrip: (rideId: string, otp: string) => Promise<void>;
  completeTrip: (rideId: string) => Promise<void>;

  // State
  setActiveRide: (ride: any) => void;
  updateRideStatus: (status: string) => void;
  clearActiveRide: () => void;
  addRideRequest: (request: RideRequest) => void;
  removeRideRequest: (id: string) => void;
}

export const useRideStore = create<RideState>((set, get) => ({
  activeRide: null,
  rideRequests: [],
  estimatedFare: null,
  isBooking: false,

  // Customer
  getEstimate: async (pickup, drop) => {
    const res = await api.post("/customer/rides/estimate", {
      pickupLat: pickup.latitude,
      pickupLng: pickup.longitude,
      dropLat: drop.latitude,
      dropLng: drop.longitude,
    });
    set({ estimatedFare: res.data.data.total });
    return res.data.data;
  },

  bookRide: async (data) => {
    set({ isBooking: true });
    try {
      const res = await api.post("/customer/rides/book", data);
      set({ activeRide: res.data.data, isBooking: false });
    } catch (err) {
      set({ isBooking: false });
      throw err;
    }
  },

  cancelRide: async (rideId) => {
    await api.post(`/customer/rides/${rideId}/cancel`);
    set({ activeRide: null });
  },

  rateRide: async (rideId, rating, review) => {
    await api.post(`/customer/rides/${rideId}/rate`, { rating, review });
    set({ activeRide: null });
  },

  // Driver
  acceptRide: async (rideId) => {
    const res = await api.post(`/driver/rides/${rideId}/accept`);
    set({ activeRide: res.data.data });
    set((s) => ({ rideRequests: s.rideRequests.filter((r) => r.id !== rideId) }));
  },

  rejectRide: async (rideId) => {
    await api.post(`/driver/rides/${rideId}/reject`);
    set((s) => ({ rideRequests: s.rideRequests.filter((r) => r.id !== rideId) }));
  },

  arrivedAtPickup: async (rideId) => {
    await api.post(`/driver/rides/${rideId}/arrived`);
    set((s) => ({
      activeRide: s.activeRide ? { ...s.activeRide, status: "ARRIVED" } : null,
    }));
  },

  startTrip: async (rideId, otp) => {
    await api.post(`/driver/rides/${rideId}/start`, { otp });
    set((s) => ({
      activeRide: s.activeRide ? { ...s.activeRide, status: "IN_PROGRESS" } : null,
    }));
  },

  completeTrip: async (rideId) => {
    const res = await api.post(`/driver/rides/${rideId}/complete`);
    set((s) => ({
      activeRide: s.activeRide ? { ...s.activeRide, status: "COMPLETED", finalFare: res.data.data.finalFare } : null,
    }));
  },

  // State management
  setActiveRide: (ride) => set({ activeRide: ride }),
  updateRideStatus: (status) =>
    set((s) => ({
      activeRide: s.activeRide ? { ...s.activeRide, status } : null,
    })),
  clearActiveRide: () => set({ activeRide: null }),
  addRideRequest: (request) =>
    set((s) => ({ rideRequests: [request, ...s.rideRequests] })),
  removeRideRequest: (id) =>
    set((s) => ({ rideRequests: s.rideRequests.filter((r) => r.id !== id) })),
}));
