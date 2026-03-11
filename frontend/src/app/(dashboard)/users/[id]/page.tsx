"use client";

import { useGetUserQuery, useGetUserRidesQuery } from "@/store/api/usersApi";
import { useParams } from "next/navigation";
import { ArrowLeft, Phone, Mail, Calendar, MapPin } from "lucide-react";
import Link from "next/link";

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading } = useGetUserQuery(id);
  const { data: ridesData } = useGetUserRidesQuery({ id });

  if (isLoading) return <div className="flex items-center justify-center h-64"><p>Loading...</p></div>;

  const user = data?.data;
  const rides = ridesData?.data?.data || [];

  return (
    <div className="space-y-6">
      <Link href="/users" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="w-4 h-4" /> Back to Users
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="text-center">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-primary font-bold text-2xl">{user?.name?.charAt(0) || "?"}</span>
            </div>
            <h2 className="text-xl font-bold">{user?.name || "Unnamed"}</h2>
            <span className={`inline-block mt-2 px-3 py-1 text-xs rounded-full font-medium ${
              user?.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
            }`}>
              {user?.isActive ? "Active" : "Banned"}
            </span>
          </div>
          <div className="mt-6 space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Phone className="w-4 h-4 text-gray-400" />
              <span>{user?.phone}</span>
            </div>
            {user?.email && (
              <div className="flex items-center gap-3 text-sm">
                <Mail className="w-4 h-4 text-gray-400" />
                <span>{user?.email}</span>
              </div>
            )}
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span>Joined {new Date(user?.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Ride History */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Recent Rides</h3>
          <div className="space-y-3">
            {rides.length === 0 ? (
              <p className="text-gray-500 text-sm">No rides found</p>
            ) : (
              rides.slice(0, 10).map((ride: any) => (
                <div key={ride.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-3 h-3 text-green-500" />
                      <span className="truncate">{ride.pickupAddress}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm mt-1">
                      <MapPin className="w-3 h-3 text-red-500" />
                      <span className="truncate">{ride.dropAddress}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-sm">₹{ride.finalFare || ride.estimatedFare}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      ride.status === "COMPLETED" ? "bg-green-100 text-green-700" :
                      ride.status === "CANCELLED" ? "bg-red-100 text-red-700" :
                      "bg-yellow-100 text-yellow-700"
                    }`}>{ride.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
