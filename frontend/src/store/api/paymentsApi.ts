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

export const paymentsApi = createApi({
  reducerPath: "paymentsApi",
  baseQuery,
  tagTypes: ["Payments", "PaymentSummary", "Payouts"],
  endpoints: (builder) => ({
    getPayments: builder.query<any, { page?: number; limit?: number }>({
      query: ({ page = 1, limit = 20 }) => `/admin/payments?page=${page}&limit=${limit}`,
      providesTags: ["Payments"],
    }),
    getPaymentSummary: builder.query<any, void>({
      query: () => "/admin/payments/summary",
      providesTags: ["PaymentSummary"],
    }),
    getDriverPayouts: builder.query<any, void>({
      query: () => "/admin/payments/driver-payouts",
      providesTags: ["Payouts"],
    }),
    processPayouts: builder.mutation<any, { driverIds: string[] }>({
      query: (body) => ({
        url: "/admin/payments/driver-payouts/process",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Payouts"],
    }),
  }),
});

export const {
  useGetPaymentsQuery, useGetPaymentSummaryQuery,
  useGetDriverPayoutsQuery, useProcessPayoutsMutation,
} = paymentsApi;
