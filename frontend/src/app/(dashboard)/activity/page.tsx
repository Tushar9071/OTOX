"use client";

import { useGetAdminsQuery, useCreateAdminMutation, useDeleteAdminMutation, useGetActivityLogQuery } from "@/store/api/rolesApi";
import { useState } from "react";
import { Plus, Trash2, Shield, Clock } from "lucide-react";

const ROLES = ["SUPER_ADMIN", "ADMIN", "OPERATIONS_MANAGER", "SUPPORT_AGENT", "FINANCE_MANAGER", "VIEWER"];

export default function ActivityLogPage() {
  const { data: adminsData } = useGetAdminsQuery();
  const { data: logData } = useGetActivityLogQuery({ page: 1 });
  const [createAdmin] = useCreateAdminMutation();
  const [deleteAdmin] = useDeleteAdminMutation();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ email: "", name: "", role: "VIEWER" });

  const admins = adminsData?.data || [];
  const logs = logData?.data?.data || [];

  const handleCreate = async () => {
    await createAdmin(form);
    setShowForm(false);
    setForm({ email: "", name: "", role: "VIEWER" });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Roles &amp; Activity</h1>

      {/* Admin Management */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2"><Shield className="w-5 h-5" /> Admin Users</h3>
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-orange-600">
            <Plus className="w-4 h-4" /> Add Admin
          </button>
        </div>

        {showForm && (
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input type="text" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="px-3 py-2 border rounded-lg text-sm" />
              <input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="px-3 py-2 border rounded-lg text-sm" />
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="px-3 py-2 border rounded-lg text-sm">
                {ROLES.map((r) => <option key={r} value={r}>{r.replace(/_/g, " ")}</option>)}
              </select>
            </div>
            <div className="flex gap-2 mt-3">
              <button onClick={handleCreate} className="px-4 py-2 bg-primary text-white rounded-lg text-sm">Create</button>
              <button onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg text-sm">Cancel</button>
            </div>
          </div>
        )}

        <div className="divide-y">
          {admins.map((admin: any) => (
            <div key={admin.id} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-sm">
                  {admin.name?.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium">{admin.name}</p>
                  <p className="text-xs text-gray-500">{admin.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                  {admin.role?.replace(/_/g, " ")}
                </span>
                {admin.role !== "SUPER_ADMIN" && (
                  <button onClick={() => deleteAdmin(admin.id)} className="p-1.5 hover:bg-red-50 rounded-lg">
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Activity Log */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><Clock className="w-5 h-5" /> Activity Log</h3>
        <div className="space-y-3">
          {logs.length === 0 ? (
            <p className="text-sm text-gray-500">No activity recorded</p>
          ) : (
            logs.map((log: any) => (
              <div key={log.id} className="flex items-center gap-4 py-2 border-b last:border-0">
                <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <span className="font-medium">{log.admin?.name || "System"}</span>
                    {" "}<span className="text-gray-600">{log.action}</span>
                    {log.details && <span className="text-gray-400"> — {log.details}</span>}
                  </p>
                </div>
                <span className="text-xs text-gray-400 flex-shrink-0">{new Date(log.createdAt).toLocaleString()}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
