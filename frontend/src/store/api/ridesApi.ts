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

export const ridesApi = createApi({
  reducerPath: "ridesApi",
  baseQuery,
  tagTypes: ["Rides", "Ride"],
  endpoints: (builder) => ({
    getRides: builder.query<any, { page?: number; limit?: number; status?: string }>({
      query: ({ page = 1, limit = 20, status }) => {
        let url = `/admin/rides?page=${page}&limit=${limit}`;
        if (status) url += `&status=${status}`;
        return url;
      },
      providesTags: ["Rides"],
    }),
    getRide: builder.query<any, string>({
      query: (id) => `/admin/rides/${id}`,
      providesTags: (result, error, id) => [{ type: "Ride", id }],
    }),
    refundRide: builder.mutation<any, { id: string; amount?: number }>({
      query: ({ id, amount }) => ({
        url: `/admin/rides/${id}/refund`,
        method: "POST",
        body: { amount },
      }),
      invalidatesTags: ["Rides"],
    }),
  }),
});

export const { useGetRidesQuery, useGetRideQuery, useRefundRideMutation } = ridesApi;
