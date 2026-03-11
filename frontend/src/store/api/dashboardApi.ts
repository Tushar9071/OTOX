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

export const dashboardApi = createApi({
  reducerPath: "dashboardApi",
  baseQuery,
  tagTypes: ["Stats", "Analytics", "Live"],
  endpoints: (builder) => ({
    getStats: builder.query<any, void>({
      query: () => "/admin/dashboard/stats",
      providesTags: ["Stats"],
    }),
    getAnalytics: builder.query<any, string>({
      query: (range) => `/admin/dashboard/analytics?range=${range}`,
      providesTags: ["Analytics"],
    }),
    getLiveData: builder.query<any, void>({
      query: () => "/admin/dashboard/live",
      providesTags: ["Live"],
    }),
  }),
});

export const { useGetStatsQuery, useGetAnalyticsQuery, useGetLiveDataQuery } = dashboardApi;
