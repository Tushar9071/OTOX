"use client";

import { useGetRideQuery, useRefundRideMutation } from "@/store/api/ridesApi";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin, User, Car, Clock, IndianRupee } from "lucide-react";
import { useState } from "react";

export default function RideDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading } = useGetRideQuery(id);
  const [refund, { isLoading: refunding }] = useRefundRideMutation();
  const [showRefund, setShowRefund] = useState(false);

  if (isLoading) return <div className="flex items-center justify-center h-64"><p>Loading...</p></div>;

  const ride = data?.data;

  return (
    <div className="space-y-6">
      <Link href="/rides" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="w-4 h-4" /> Back to Rides
      </Link>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Ride Details</h1>
        {ride?.status === "COMPLETED" && (
          <button
            onClick={() => setShowRefund(!showRefund)}
            className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600"
          >
            Issue Refund
          </button>
        )}
      </div>

      {showRefund && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm text-red-700 mb-3">This will refund the full fare to the customer&#39;s wallet.</p>
          <button
            onClick={() => refund({ id }).then(() => setShowRefund(false))}
            disabled={refunding}
            className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            {refunding ? "Processing..." : "Confirm Refund"}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Route */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Route</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <MapPin className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Pickup</p>
                <p className="text-sm text-gray-600">{ride?.pickupAddress}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <MapPin className="w-4 h-4 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Drop</p>
                <p className="text-sm text-gray-600">{ride?.dropAddress}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div><p className="text-xs text-gray-500">Distance</p><p className="font-medium">{ride?.distance?.toFixed(1)} km</p></div>
              <div><p className="text-xs text-gray-500">Duration</p><p className="font-medium">{ride?.duration} min</p></div>
            </div>
          </div>
        </div>

        {/* Fare Breakdown */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Fare Details</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Estimated Fare</span>
              <span className="font-medium">₹{ride?.estimatedFare}</span>
            </div>
            {ride?.finalFare && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Final Fare</span>
                <span className="font-medium">₹{ride.finalFare}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Payment Method</span>
              <span className="font-medium">{ride?.paymentMethod}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Payment Status</span>
              <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                ride?.paymentStatus === "COMPLETED" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
              }`}>{ride?.paymentStatus}</span>
            </div>
          </div>
        </div>

        {/* Customer */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><User className="w-5 h-5" /> Customer</h3>
          <div className="space-y-2 text-sm">
            <p><span className="text-gray-500">Name:</span> <span className="font-medium ml-2">{ride?.customer?.user?.name || "N/A"}</span></p>
            <p><span className="text-gray-500">Phone:</span> <span className="font-medium ml-2">{ride?.customer?.user?.phone}</span></p>
          </div>
        </div>

        {/* Driver */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><Car className="w-5 h-5" /> Driver</h3>
          {ride?.driver ? (
            <div className="space-y-2 text-sm">
              <p><span className="text-gray-500">Name:</span> <span className="font-medium ml-2">{ride.driver.user?.name}</span></p>
              <p><span className="text-gray-500">Phone:</span> <span className="font-medium ml-2">{ride.driver.user?.phone}</span></p>
              <p><span className="text-gray-500">Vehicle:</span> <span className="font-medium ml-2">{ride.driver.vehicle?.registrationNumber}</span></p>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No driver assigned</p>
          )}
        </div>

        {/* Timeline */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><Clock className="w-5 h-5" /> Timeline</h3>
          <div className="space-y-3">
            {[
              { label: "Created", time: ride?.createdAt },
              { label: "Accepted", time: ride?.acceptedAt },
              { label: "Driver Arrived", time: ride?.arrivedAt },
              { label: "Trip Started", time: ride?.startedAt },
              { label: "Completed", time: ride?.completedAt },
              { label: "Cancelled", time: ride?.cancelledAt },
            ].filter(e => e.time).map((event, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-2 h-2 bg-primary rounded-full" />
                <span className="text-sm font-medium w-32">{event.label}</span>
                <span className="text-sm text-gray-500">{new Date(event.time).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
