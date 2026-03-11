import { configureStore } from "@reduxjs/toolkit";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import authReducer from "./authSlice";
import { dashboardApi } from "./api/dashboardApi";
import { usersApi } from "./api/usersApi";
import { driversApi } from "./api/driversApi";
import { ridesApi } from "./api/ridesApi";
import { paymentsApi } from "./api/paymentsApi";
import { supportApi } from "./api/supportApi";
import { errorsApi } from "./api/errorsApi";
import { promotionsApi } from "./api/promotionsApi";
import { settingsApi } from "./api/settingsApi";
import { rolesApi } from "./api/rolesApi";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    [dashboardApi.reducerPath]: dashboardApi.reducer,
    [usersApi.reducerPath]: usersApi.reducer,
    [driversApi.reducerPath]: driversApi.reducer,
    [ridesApi.reducerPath]: ridesApi.reducer,
    [paymentsApi.reducerPath]: paymentsApi.reducer,
    [supportApi.reducerPath]: supportApi.reducer,
    [errorsApi.reducerPath]: errorsApi.reducer,
    [promotionsApi.reducerPath]: promotionsApi.reducer,
    [settingsApi.reducerPath]: settingsApi.reducer,
    [rolesApi.reducerPath]: rolesApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      dashboardApi.middleware,
      usersApi.middleware,
      driversApi.middleware,
      ridesApi.middleware,
      paymentsApi.middleware,
      supportApi.middleware,
      errorsApi.middleware,
      promotionsApi.middleware,
      settingsApi.middleware,
      rolesApi.middleware,
    ),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
