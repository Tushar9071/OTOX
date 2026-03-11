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

export const usersApi = createApi({
  reducerPath: "usersApi",
  baseQuery,
  tagTypes: ["Users", "User"],
  endpoints: (builder) => ({
    getUsers: builder.query<any, { page?: number; limit?: number; search?: string }>({
      query: ({ page = 1, limit = 20, search }) =>
        `/admin/users?page=${page}&limit=${limit}${search ? `&search=${search}` : ""}`,
      providesTags: ["Users"],
    }),
    getUser: builder.query<any, string>({
      query: (id) => `/admin/users/${id}`,
      providesTags: (result, error, id) => [{ type: "User", id }],
    }),
    updateUserStatus: builder.mutation<any, { id: string; isActive: boolean }>({
      query: ({ id, isActive }) => ({
        url: `/admin/users/${id}/status`,
        method: "PATCH",
        body: { isActive },
      }),
      invalidatesTags: ["Users"],
    }),
    getUserRides: builder.query<any, { id: string; page?: number }>({
      query: ({ id, page = 1 }) => `/admin/users/${id}/rides?page=${page}`,
    }),
  }),
});

export const { useGetUsersQuery, useGetUserQuery, useUpdateUserStatusMutation, useGetUserRidesQuery } = usersApi;
