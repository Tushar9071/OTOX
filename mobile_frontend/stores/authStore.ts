import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "@/services/api";

interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  role: "CUSTOMER" | "DRIVER";
  isActive: boolean;
  customerProfile?: any;
  driverProfile?: any;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  userType: "customer" | "driver" | null;

  initialize: () => Promise<void>;
  verifyOtp: (firebaseToken: string) => Promise<{ isNewUser: boolean }>;
  register: (data: { name: string; role: string; firebaseToken: string }) => Promise<void>;
  setUserType: (type: "customer" | "driver") => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  userType: null,

  initialize: async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const userType = await AsyncStorage.getItem("userType") as "customer" | "driver" | null;
      if (token) {
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        const endpoint = userType === "driver" ? "/driver/profile" : "/customer/profile";
        const res = await api.get(endpoint);
        set({ user: res.data.data, token, isAuthenticated: true, userType, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch {
      await AsyncStorage.multiRemove(["token", "refreshToken", "userType"]);
      set({ isLoading: false });
    }
  },

  verifyOtp: async (firebaseToken: string) => {
    const res = await api.post("/auth/verify", { firebaseToken });
    const { user, token, refreshToken, isNewUser } = res.data.data;
    if (!isNewUser) {
      await AsyncStorage.setItem("token", token);
      await AsyncStorage.setItem("refreshToken", refreshToken);
      const userType = user.role === "DRIVER" ? "driver" : "customer";
      await AsyncStorage.setItem("userType", userType);
      set({ user, token, isAuthenticated: true, userType });
    }
    return { isNewUser };
  },

  register: async (data) => {
    const res = await api.post("/auth/register", data);
    const { user, token, refreshToken } = res.data.data;
    await AsyncStorage.setItem("token", token);
    await AsyncStorage.setItem("refreshToken", refreshToken);
    const userType = user.role === "DRIVER" ? "driver" : "customer";
    await AsyncStorage.setItem("userType", userType);
    set({ user, token, isAuthenticated: true, userType });
  },

  setUserType: (type) => {
    AsyncStorage.setItem("userType", type);
    set({ userType: type });
  },

  logout: async () => {
    await AsyncStorage.multiRemove(["token", "refreshToken", "userType"]);
    set({ user: null, token: null, isAuthenticated: false, userType: null });
  },
}));
