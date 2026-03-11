import { create } from "zustand";

interface Location {
  latitude: number;
  longitude: number;
}

interface LocationState {
  currentLocation: Location | null;
  driverLocation: Location | null;
  pickupLocation: Location | null;
  dropLocation: Location | null;
  pickupAddress: string;
  dropAddress: string;

  setCurrentLocation: (loc: Location) => void;
  setDriverLocation: (loc: Location) => void;
  setPickupLocation: (loc: Location, address: string) => void;
  setDropLocation: (loc: Location, address: string) => void;
  clearLocations: () => void;
}

export const useLocationStore = create<LocationState>((set) => ({
  currentLocation: null,
  driverLocation: null,
  pickupLocation: null,
  dropLocation: null,
  pickupAddress: "",
  dropAddress: "",

  setCurrentLocation: (loc) => set({ currentLocation: loc }),
  setDriverLocation: (loc) => set({ driverLocation: loc }),
  setPickupLocation: (loc, address) => set({ pickupLocation: loc, pickupAddress: address }),
  setDropLocation: (loc, address) => set({ dropLocation: loc, dropAddress: address }),
  clearLocations: () =>
    set({
      driverLocation: null,
      pickupLocation: null,
      dropLocation: null,
      pickupAddress: "",
      dropAddress: "",
    }),
}));
