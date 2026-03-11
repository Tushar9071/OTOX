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

export const supportApi = createApi({
  reducerPath: "supportApi",
  baseQuery,
  tagTypes: ["Tickets", "Ticket"],
  endpoints: (builder) => ({
    getTickets: builder.query<any, { page?: number; status?: string; priority?: string }>({
      query: ({ page = 1, status, priority }) => {
        let url = `/admin/support/tickets?page=${page}`;
        if (status) url += `&status=${status}`;
        if (priority) url += `&priority=${priority}`;
        return url;
      },
      providesTags: ["Tickets"],
    }),
    getTicket: builder.query<any, string>({
      query: (id) => `/admin/support/tickets/${id}`,
      providesTags: (result, error, id) => [{ type: "Ticket", id }],
    }),
    replyToTicket: builder.mutation<any, { id: string; message: string }>({
      query: ({ id, message }) => ({
        url: `/admin/support/tickets/${id}/messages`,
        method: "POST",
        body: { message },
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Ticket", id }],
    }),
    assignTicket: builder.mutation<any, { id: string; adminId: string }>({
      query: ({ id, adminId }) => ({
        url: `/admin/support/tickets/${id}/assign`,
        method: "PATCH",
        body: { adminId },
      }),
      invalidatesTags: ["Tickets"],
    }),
    updateTicketStatus: builder.mutation<any, { id: string; status: string }>({
      query: ({ id, status }) => ({
        url: `/admin/support/tickets/${id}/status`,
        method: "PATCH",
        body: { status },
      }),
      invalidatesTags: ["Tickets"],
    }),
  }),
});

export const {
  useGetTicketsQuery, useGetTicketQuery,
  useReplyToTicketMutation, useAssignTicketMutation, useUpdateTicketStatusMutation,
} = supportApi;
