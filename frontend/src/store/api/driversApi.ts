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

export const driversApi = createApi({
  reducerPath: "driversApi",
  baseQuery,
  tagTypes: ["Drivers", "Driver"],
  endpoints: (builder) => ({
    getDrivers: builder.query<any, { page?: number; limit?: number; status?: string; search?: string }>({
      query: ({ page = 1, limit = 20, status, search }) => {
        let url = `/admin/drivers?page=${page}&limit=${limit}`;
        if (status) url += `&status=${status}`;
        if (search) url += `&search=${search}`;
        return url;
      },
      providesTags: ["Drivers"],
    }),
    getDriver: builder.query<any, string>({
      query: (id) => `/admin/drivers/${id}`,
      providesTags: (result, error, id) => [{ type: "Driver", id }],
    }),
    approveDriver: builder.mutation<any, string>({
      query: (id) => ({ url: `/admin/drivers/${id}/approve`, method: "PATCH" }),
      invalidatesTags: ["Drivers"],
    }),
    rejectDriver: builder.mutation<any, { id: string; reason: string }>({
      query: ({ id, reason }) => ({
        url: `/admin/drivers/${id}/reject`,
        method: "PATCH",
        body: { reason },
      }),
      invalidatesTags: ["Drivers"],
    }),
    updateDriverStatus: builder.mutation<any, { id: string; userId: string; isActive: boolean }>({
      query: ({ id, userId, isActive }) => ({
        url: `/admin/drivers/${id}/status`,
        method: "PATCH",
        body: { userId, isActive },
      }),
      invalidatesTags: ["Drivers"],
    }),
  }),
});

export const {
  useGetDriversQuery, useGetDriverQuery,
  useApproveDriverMutation, useRejectDriverMutation, useUpdateDriverStatusMutation,
} = driversApi;
