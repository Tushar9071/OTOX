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

export const rolesApi = createApi({
  reducerPath: "rolesApi",
  baseQuery,
  tagTypes: ["Admins", "ActivityLog"],
  endpoints: (builder) => ({
    getAdmins: builder.query<any, void>({
      query: () => "/admin/roles/admins",
      providesTags: ["Admins"],
    }),
    createAdmin: builder.mutation<any, any>({
      query: (body) => ({ url: "/admin/roles/admins", method: "POST", body }),
      invalidatesTags: ["Admins"],
    }),
    updateAdmin: builder.mutation<any, { id: string; data: any }>({
      query: ({ id, data }) => ({ url: `/admin/roles/admins/${id}`, method: "PATCH", body: data }),
      invalidatesTags: ["Admins"],
    }),
    deleteAdmin: builder.mutation<any, string>({
      query: (id) => ({ url: `/admin/roles/admins/${id}`, method: "DELETE" }),
      invalidatesTags: ["Admins"],
    }),
    getActivityLog: builder.query<any, { page?: number }>({
      query: ({ page = 1 }) => `/admin/roles/activity?page=${page}`,
      providesTags: ["ActivityLog"],
    }),
  }),
});

export const {
  useGetAdminsQuery, useCreateAdminMutation,
  useUpdateAdminMutation, useDeleteAdminMutation, useGetActivityLogQuery,
} = rolesApi;
