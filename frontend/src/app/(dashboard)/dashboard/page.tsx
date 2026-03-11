"use client";

import { useGetStatsQuery, useGetAnalyticsQuery, useGetLiveDataQuery } from "@/store/api/dashboardApi";
import {
  Users, Car, Navigation, IndianRupee, TrendingUp, AlertTriangle, Clock, Star,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell,
} from "recharts";
import { useState } from "react";

const COLORS = ["#F97316", "#3B82F6", "#10B981", "#EF4444", "#8B5CF6"];

function StatsCard({ title, value, icon: Icon, change, color }: any) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {change !== undefined && (
            <p className={`text-xs mt-1 ${change >= 0 ? "text-green-600" : "text-red-600"}`}>
              {change >= 0 ? "+" : ""}{change}% vs last week
            </p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useGetStatsQuery();
  const [range, setRange] = useState("7d");
  const { data: analytics } = useGetAnalyticsQuery(range);
  const { data: live } = useGetLiveDataQuery(undefined, { pollingInterval: 10000 });

  const s = stats?.data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="flex gap-2">
          {["7d", "30d", "90d"].map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1.5 text-sm rounded-lg ${
                range === r ? "bg-primary text-white" : "bg-white border text-gray-600 hover:bg-gray-50"
              }`}
            >
              {r === "7d" ? "7 Days" : r === "30d" ? "30 Days" : "90 Days"}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Total Users" value={s?.totalUsers?.toLocaleString() || "0"} icon={Users} color="bg-blue-500" />
        <StatsCard title="Active Drivers" value={s?.activeDrivers?.toLocaleString() || "0"} icon={Car} color="bg-green-500" />
        <StatsCard title="Today's Rides" value={s?.todayRides?.toLocaleString() || "0"} icon={Navigation} color="bg-primary" />
        <StatsCard title="Today's Revenue" value={`₹${s?.todayRevenue?.toLocaleString() || "0"}`} icon={IndianRupee} color="bg-purple-500" />
        <StatsCard title="Total Revenue" value={`₹${s?.totalRevenue?.toLocaleString() || "0"}`} icon={TrendingUp} color="bg-emerald-500" />
        <StatsCard title="Avg Rating" value={s?.avgRating?.toFixed(1) || "0.0"} icon={Star} color="bg-yellow-500" />
        <StatsCard title="Pending Approvals" value={s?.pendingDriverApprovals?.toLocaleString() || "0"} icon={Clock} color="bg-orange-500" />
        <StatsCard title="Open Tickets" value={s?.openTickets?.toLocaleString() || "0"} icon={AlertTriangle} color="bg-red-500" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <h3 className="font-semibold text-gray-900 mb-4">Revenue Overview</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={analytics?.data?.revenueChart || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Area type="monotone" dataKey="revenue" stroke="#F97316" fill="#F9731633" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Rides Chart */}
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <h3 className="font-semibold text-gray-900 mb-4">Rides Overview</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics?.data?.ridesChart || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="completed" fill="#10B981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="cancelled" fill="#EF4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Live Activity */}
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Live Activity</h3>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm text-gray-500">Live</span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-blue-600">Active Rides</p>
            <p className="text-3xl font-bold text-blue-700">{live?.data?.activeRides || 0}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-sm text-green-600">Online Drivers</p>
            <p className="text-3xl font-bold text-green-700">{live?.data?.onlineDrivers || 0}</p>
          </div>
          <div className="bg-orange-50 rounded-lg p-4">
            <p className="text-sm text-orange-600">Searching Customers</p>
            <p className="text-3xl font-bold text-orange-700">{live?.data?.searchingCustomers || 0}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
