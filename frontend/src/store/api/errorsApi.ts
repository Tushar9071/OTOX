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

export const errorsApi = createApi({
  reducerPath: "errorsApi",
  baseQuery,
  tagTypes: ["Errors"],
  endpoints: (builder) => ({
    getErrors: builder.query<any, { page?: number; severity?: string; resolved?: string }>({
      query: ({ page = 1, severity, resolved }) => {
        let url = `/admin/errors?page=${page}`;
        if (severity) url += `&severity=${severity}`;
        if (resolved) url += `&resolved=${resolved}`;
        return url;
      },
      providesTags: ["Errors"],
    }),
    resolveError: builder.mutation<any, string>({
      query: (id) => ({ url: `/admin/errors/${id}/resolve`, method: "PATCH" }),
      invalidatesTags: ["Errors"],
    }),
  }),
});

export const { useGetErrorsQuery, useResolveErrorMutation } = errorsApi;
