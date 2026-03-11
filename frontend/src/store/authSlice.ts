import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { AdminUser } from "@/lib/types";

interface AuthState {
  admin: AdminUser | null;
  token: string | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  admin: null,
  token: typeof window !== "undefined" ? localStorage.getItem("adminToken") : null,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<{ admin: AdminUser; token: string }>) {
      state.admin = action.payload.admin;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      if (typeof window !== "undefined") {
        localStorage.setItem("adminToken", action.payload.token);
      }
    },
    logout(state) {
      state.admin = null;
      state.token = null;
      state.isAuthenticated = false;
      if (typeof window !== "undefined") {
        localStorage.removeItem("adminToken");
      }
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
