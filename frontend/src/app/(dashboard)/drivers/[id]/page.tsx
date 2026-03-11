"use client";

import { useGetDriverQuery } from "@/store/api/driversApi";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Phone, Star, Car, FileText, Calendar } from "lucide-react";

export default function DriverDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading } = useGetDriverQuery(id);

  if (isLoading) return <div className="flex items-center justify-center h-64"><p>Loading...</p></div>;

  const driver = data?.data;

  return (
    <div className="space-y-6">
      <Link href="/drivers" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="w-4 h-4" /> Back to Drivers
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Driver Profile */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="text-center">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-blue-600 font-bold text-2xl">{driver?.user?.name?.charAt(0)}</span>
            </div>
            <h2 className="text-xl font-bold">{driver?.user?.name}</h2>
            <div className="flex items-center justify-center gap-1 mt-2">
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              <span className="font-medium">{driver?.rating?.toFixed(1) || "N/A"}</span>
            </div>
            <span className={`inline-block mt-2 px-3 py-1 text-xs rounded-full font-medium ${
              driver?.approvalStatus === "APPROVED" ? "bg-green-100 text-green-700" :
              driver?.approvalStatus === "REJECTED" ? "bg-red-100 text-red-700" :
              "bg-yellow-100 text-yellow-700"
            }`}>{driver?.approvalStatus}</span>
          </div>
          <div className="mt-6 space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Phone className="w-4 h-4 text-gray-400" />
              <span>{driver?.user?.phone}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <FileText className="w-4 h-4 text-gray-400" />
              <span>License: {driver?.licenseNumber}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span>Joined {new Date(driver?.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Vehicle & Stats */}
        <div className="lg:col-span-2 space-y-6">
          {/* Vehicle */}
          {driver?.vehicle && (
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Car className="w-5 h-5" /> Vehicle Details
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-gray-500">Make:</span> <span className="font-medium ml-2">{driver.vehicle.make}</span></div>
                <div><span className="text-gray-500">Model:</span> <span className="font-medium ml-2">{driver.vehicle.model}</span></div>
                <div><span className="text-gray-500">Year:</span> <span className="font-medium ml-2">{driver.vehicle.year}</span></div>
                <div><span className="text-gray-500">Color:</span> <span className="font-medium ml-2">{driver.vehicle.color}</span></div>
                <div><span className="text-gray-500">Reg No:</span> <span className="font-medium ml-2">{driver.vehicle.registrationNumber}</span></div>
                <div><span className="text-gray-500">Permit:</span> <span className="font-medium ml-2">{driver.vehicle.permitNumber}</span></div>
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Performance</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-blue-700">{driver?.totalRides || 0}</p>
                <p className="text-xs text-blue-600">Total Rides</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-green-700">₹{driver?.totalEarnings?.toLocaleString() || 0}</p>
                <p className="text-xs text-green-600">Total Earnings</p>
              </div>
              <div className="bg-orange-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-orange-700">{driver?.acceptanceRate || 0}%</p>
                <p className="text-xs text-orange-600">Acceptance Rate</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-purple-700">{driver?.completionRate || 0}%</p>
                <p className="text-xs text-purple-600">Completion Rate</p>
              </div>
            </div>
          </div>

          {/* Documents */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Documents</h3>
            <div className="grid grid-cols-2 gap-4">
              {["License Front", "License Back", "RC Book", "Permit", "Insurance", "Aadhar"].map((doc) => (
                <div key={doc} className="border rounded-lg p-4 flex items-center justify-between">
                  <span className="text-sm font-medium">{doc}</span>
                  <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">Uploaded</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
