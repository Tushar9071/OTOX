"use client";

import { useGetRidesQuery } from "@/store/api/ridesApi";
import { useState } from "react";
import Link from "next/link";
import { Eye, MapPin } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  SEARCHING: "bg-yellow-100 text-yellow-700",
  ACCEPTED: "bg-blue-100 text-blue-700",
  ARRIVED: "bg-indigo-100 text-indigo-700",
  IN_PROGRESS: "bg-purple-100 text-purple-700",
  COMPLETED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
};

export default function RidesPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const { data, isLoading } = useGetRidesQuery({ page, status: statusFilter || undefined });

  const rides = data?.data?.data || [];
  const pagination = data?.data?.pagination;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Rides</h1>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="border rounded-lg px-3 py-2 text-sm bg-white"
        >
          <option value="">All Status</option>
          {Object.keys(STATUS_COLORS).map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ride ID</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Driver</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Route</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fare</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-500">Loading...</td></tr>
            ) : rides.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-500">No rides found</td></tr>
            ) : (
              rides.map((ride: any) => (
                <tr key={ride.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-mono text-gray-600">{ride.id.slice(0, 8)}...</td>
                  <td className="px-4 py-3 text-sm">{ride.customer?.user?.name || "N/A"}</td>
                  <td className="px-4 py-3 text-sm">{ride.driver?.user?.name || "Unassigned"}</td>
                  <td className="px-4 py-3">
                    <div className="text-xs space-y-1 max-w-[200px]">
                      <div className="flex items-center gap-1 truncate">
                        <MapPin className="w-3 h-3 text-green-500 flex-shrink-0" />
                        <span className="truncate">{ride.pickupAddress}</span>
                      </div>
                      <div className="flex items-center gap-1 truncate">
                        <MapPin className="w-3 h-3 text-red-500 flex-shrink-0" />
                        <span className="truncate">{ride.dropAddress}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium">₹{ride.finalFare || ride.estimatedFare}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${STATUS_COLORS[ride.status] || "bg-gray-100 text-gray-700"}`}>
                      {ride.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{new Date(ride.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <Link href={`/rides/${ride.id}`} className="p-1.5 hover:bg-gray-100 rounded-lg inline-block">
                      <Eye className="w-4 h-4 text-gray-500" />
                    </Link>
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
