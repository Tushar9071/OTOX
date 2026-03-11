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

export const promotionsApi = createApi({
  reducerPath: "promotionsApi",
  baseQuery,
  tagTypes: ["Promotions"],
  endpoints: (builder) => ({
    getPromotions: builder.query<any, { page?: number }>({
      query: ({ page = 1 }) => `/admin/promotions?page=${page}`,
      providesTags: ["Promotions"],
    }),
    createPromotion: builder.mutation<any, any>({
      query: (body) => ({ url: "/admin/promotions", method: "POST", body }),
      invalidatesTags: ["Promotions"],
    }),
    updatePromotion: builder.mutation<any, { id: string; data: any }>({
      query: ({ id, data }) => ({ url: `/admin/promotions/${id}`, method: "PATCH", body: data }),
      invalidatesTags: ["Promotions"],
    }),
    deletePromotion: builder.mutation<any, string>({
      query: (id) => ({ url: `/admin/promotions/${id}`, method: "DELETE" }),
      invalidatesTags: ["Promotions"],
    }),
  }),
});

export const {
  useGetPromotionsQuery, useCreatePromotionMutation,
  useUpdatePromotionMutation, useDeletePromotionMutation,
} = promotionsApi;
