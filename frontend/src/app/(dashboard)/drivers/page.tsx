"use client";

import {
  useGetDriversQuery, useApproveDriverMutation, useRejectDriverMutation,
} from "@/store/api/driversApi";
import { useState } from "react";
import Link from "next/link";
import { Search, Eye, CheckCircle, XCircle, Filter } from "lucide-react";

export default function DriversPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const { data, isLoading } = useGetDriversQuery({ page, search: search || undefined, status: statusFilter || undefined });
  const [approve] = useApproveDriverMutation();
  const [reject] = useRejectDriverMutation();

  const drivers = data?.data?.data || [];
  const pagination = data?.data?.pagination;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Drivers</h1>
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="border rounded-lg px-3 py-2 text-sm bg-white"
          >
            <option value="">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
          <div className="flex items-center gap-2 bg-white border rounded-lg px-3 py-2 w-64">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search drivers..."
              className="bg-transparent outline-none text-sm flex-1"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Driver</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehicle</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Approval</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rating</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rides</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">Loading...</td></tr>
            ) : drivers.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">No drivers found</td></tr>
            ) : (
              drivers.map((d: any) => (
                <tr key={d.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-medium text-sm">
                        {d.user?.name?.charAt(0) || "?"}
                      </div>
                      <span className="font-medium text-sm">{d.user?.name || "Unnamed"}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{d.user?.phone}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {d.vehicle ? `${d.vehicle.make} - ${d.vehicle.registrationNumber}` : "No vehicle"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                      d.approvalStatus === "APPROVED" ? "bg-green-100 text-green-700" :
                      d.approvalStatus === "REJECTED" ? "bg-red-100 text-red-700" :
                      "bg-yellow-100 text-yellow-700"
                    }`}>{d.approvalStatus}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">⭐ {d.rating?.toFixed(1) || "N/A"}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{d.totalRides || 0}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Link href={`/drivers/${d.id}`} className="p-1.5 hover:bg-gray-100 rounded-lg" title="View">
                        <Eye className="w-4 h-4 text-gray-500" />
                      </Link>
                      {d.approvalStatus === "PENDING" && (
                        <>
                          <button onClick={() => approve(d.id)} className="p-1.5 hover:bg-green-50 rounded-lg" title="Approve">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          </button>
                          <button onClick={() => reject({ id: d.id, reason: "Does not meet requirements" })} className="p-1.5 hover:bg-red-50 rounded-lg" title="Reject">
                            <XCircle className="w-4 h-4 text-red-500" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {pagination && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <span className="text-sm text-gray-500">Page {pagination.page} of {pagination.totalPages}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-50 hover:bg-gray-50">Previous</button>
              <button onClick={() => setPage((p) => p + 1)} disabled={page >= pagination.totalPages} className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-50 hover:bg-gray-50">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
