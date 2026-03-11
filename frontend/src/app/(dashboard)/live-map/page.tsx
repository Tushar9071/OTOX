"use client";

import { useGetLiveDataQuery } from "@/store/api/dashboardApi";
import { useEffect, useRef, useState } from "react";

export default function LiveMapPage() {
  const { data: live } = useGetLiveDataQuery(undefined, { pollingInterval: 5000 });
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (!window.google || !mapRef.current || mapLoaded) return;

    const map = new window.google.maps.Map(mapRef.current, {
      center: { lat: 18.5204, lng: 73.8567 }, // Pune default
      zoom: 13,
      styles: [
        { featureType: "poi", stylers: [{ visibility: "off" }] },
      ],
    });

    setMapLoaded(true);
  }, [mapLoaded]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Live Map</h1>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-green-500 rounded-full" />
            <span>Online Drivers: {live?.data?.onlineDrivers || 0}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-blue-500 rounded-full" />
            <span>Active Rides: {live?.data?.activeRides || 0}</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div ref={mapRef} className="w-full h-[calc(100vh-200px)] bg-gray-200 flex items-center justify-center">
          {!mapLoaded && (
            <div className="text-center text-gray-500">
              <p className="text-lg font-medium">Map Loading...</p>
              <p className="text-sm mt-1">Configure Google Maps API key in .env</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

declare global {
  interface Window { google: any; }
}
