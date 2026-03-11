import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { RootState } from "..";

const baseQuery = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api",
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.token;
    if (token) headers.set("Authorization", `Bearer ${token}`);
    return headers;
  },
});

export const settingsApi = createApi({
  reducerPath: "settingsApi",
  baseQuery,
  tagTypes: ["FareConfig", "AppSettings"],
  endpoints: (builder) => ({
    getFareConfig: builder.query<any, void>({
      query: () => "/admin/settings/fare-config",
      providesTags: ["FareConfig"],
    }),
    updateFareConfig: builder.mutation<any, any>({
      query: (body) => ({ url: "/admin/settings/fare-config", method: "PUT", body }),
      invalidatesTags: ["FareConfig"],
    }),
    getAppSettings: builder.query<any, void>({
      query: () => "/admin/settings/app-settings",
      providesTags: ["AppSettings"],
    }),
    updateAppSettings: builder.mutation<any, { settings: any[] }>({
      query: (body) => ({ url: "/admin/settings/app-settings", method: "PUT", body }),
      invalidatesTags: ["AppSettings"],
    }),
  }),
});

export const {
  useGetFareConfigQuery, useUpdateFareConfigMutation,
  useGetAppSettingsQuery, useUpdateAppSettingsMutation,
} = settingsApi;
