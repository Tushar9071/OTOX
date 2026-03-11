"use client";

import { useGetTicketsQuery, useUpdateTicketStatusMutation } from "@/store/api/supportApi";
import { useState } from "react";
import Link from "next/link";
import { MessageSquare, Clock, AlertCircle, CheckCircle } from "lucide-react";

const PRIORITY_COLORS: Record<string, string> = {
  LOW: "bg-gray-100 text-gray-700",
  MEDIUM: "bg-yellow-100 text-yellow-700",
  HIGH: "bg-orange-100 text-orange-700",
  URGENT: "bg-red-100 text-red-700",
};

export default function SupportPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const { data, isLoading } = useGetTicketsQuery({ page, status: statusFilter || undefined, priority: priorityFilter || undefined });
  const [updateStatus] = useUpdateTicketStatusMutation();

  const tickets = data?.data?.data || [];
  const pagination = data?.data?.pagination;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Support Tickets</h1>
        <div className="flex gap-3">
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="border rounded-lg px-3 py-2 text-sm bg-white">
            <option value="">All Status</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>
          <select value={priorityFilter} onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }} className="border rounded-lg px-3 py-2 text-sm bg-white">
            <option value="">All Priority</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          <div className="bg-white rounded-xl p-8 text-center text-gray-500">Loading...</div>
        ) : tickets.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center text-gray-500">No tickets found</div>
        ) : (
          tickets.map((ticket: any) => (
            <Link key={ticket.id} href={`/support/${ticket.id}`}
              className="bg-white rounded-xl shadow-sm border p-4 hover:border-primary/30 transition-colors block"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-sm">{ticket.subject}</h3>
                    <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${PRIORITY_COLORS[ticket.priority] || "bg-gray-100 text-gray-700"}`}>
                      {ticket.priority}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 line-clamp-1">{ticket.description}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(ticket.createdAt).toLocaleDateString()}</span>
                    <span>{ticket.user?.name || "Unknown"}</span>
                    <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" />{ticket._count?.messages || 0} messages</span>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                  ticket.status === "OPEN" ? "bg-blue-100 text-blue-700" :
                  ticket.status === "IN_PROGRESS" ? "bg-yellow-100 text-yellow-700" :
                  ticket.status === "RESOLVED" ? "bg-green-100 text-green-700" :
                  "bg-gray-100 text-gray-700"
                }`}>{ticket.status}</span>
              </div>
            </Link>
          ))
        )}
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">Page {pagination.page} of {pagination.totalPages}</span>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-50 hover:bg-gray-50">Previous</button>
            <button onClick={() => setPage((p) => p + 1)} disabled={page >= pagination.totalPages} className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-50 hover:bg-gray-50">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
