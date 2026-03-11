"use client";

import { useGetFareConfigQuery, useUpdateFareConfigMutation, useGetAppSettingsQuery, useUpdateAppSettingsMutation } from "@/store/api/settingsApi";
import { useState, useEffect } from "react";
import { Save } from "lucide-react";

export default function SettingsPage() {
  const { data: fareData } = useGetFareConfigQuery();
  const { data: settingsData } = useGetAppSettingsQuery();
  const [updateFare, { isLoading: savingFare }] = useUpdateFareConfigMutation();
  const [updateSettings, { isLoading: savingSettings }] = useUpdateAppSettingsMutation();

  const [fare, setFare] = useState({ baseFare: 30, perKmRate: 12, perMinRate: 1.5, nightSurchargeMultiplier: 1.25, nightStartHour: 23, nightEndHour: 5, platformCommission: 15, minFare: 30, cancellationFee: 20, waitingChargePerMin: 2 });
  const [settings, setSettings] = useState<any[]>([]);

  useEffect(() => {
    if (fareData?.data) setFare(fareData.data);
  }, [fareData]);

  useEffect(() => {
    if (settingsData?.data) setSettings(settingsData.data);
  }, [settingsData]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

      {/* Fare Config */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold text-gray-900">Fare Configuration</h3>
          <button
            onClick={() => updateFare(fare)}
            disabled={savingFare}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-orange-600 disabled:opacity-50"
          >
            <Save className="w-4 h-4" /> {savingFare ? "Saving..." : "Save Changes"}
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { label: "Base Fare (₹)", key: "baseFare" },
            { label: "Per KM Rate (₹)", key: "perKmRate" },
            { label: "Per Min Rate (₹)", key: "perMinRate" },
            { label: "Night Surcharge Multiplier", key: "nightSurchargeMultiplier" },
            { label: "Night Start Hour", key: "nightStartHour" },
            { label: "Night End Hour", key: "nightEndHour" },
            { label: "Platform Commission (%)", key: "platformCommission" },
            { label: "Min Fare (₹)", key: "minFare" },
            { label: "Cancellation Fee (₹)", key: "cancellationFee" },
            { label: "Waiting Charge/Min (₹)", key: "waitingChargePerMin" },
          ].map(({ label, key }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              <input
                type="number"
                step="0.01"
                value={(fare as any)[key] || 0}
                onChange={(e) => setFare({ ...fare, [key]: Number(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
          ))}
        </div>
      </div>

      {/* App Settings */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold text-gray-900">App Settings</h3>
          <button
            onClick={() => updateSettings({ settings })}
            disabled={savingSettings}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-orange-600 disabled:opacity-50"
          >
            <Save className="w-4 h-4" /> {savingSettings ? "Saving..." : "Save Changes"}
          </button>
        </div>
        <div className="space-y-4">
          {settings.map((setting: any, i: number) => (
            <div key={setting.key} className="flex items-center justify-between py-3 border-b last:border-0">
              <div>
                <p className="text-sm font-medium">{setting.key.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}</p>
                <p className="text-xs text-gray-500">{setting.description || setting.key}</p>
              </div>
              <input
                type="text"
                value={setting.value}
                onChange={(e) => {
                  const updated = [...settings];
                  updated[i] = { ...updated[i], value: e.target.value };
                  setSettings(updated);
                }}
                className="px-3 py-2 border rounded-lg text-sm w-48 text-right"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
