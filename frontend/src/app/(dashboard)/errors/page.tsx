"use client";

import { useGetErrorsQuery, useResolveErrorMutation } from "@/store/api/errorsApi";
import { useState } from "react";
import { AlertTriangle, CheckCircle, Bug } from "lucide-react";

export default function ErrorsPage() {
  const [page, setPage] = useState(1);
  const [severity, setSeverity] = useState("");
  const [resolved, setResolved] = useState("");
  const { data, isLoading } = useGetErrorsQuery({ page, severity: severity || undefined, resolved: resolved || undefined });
  const [resolveError] = useResolveErrorMutation();

  const errors = data?.data?.data || [];
  const pagination = data?.data?.pagination;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Server Errors</h1>
        <div className="flex gap-3">
          <select value={severity} onChange={(e) => { setSeverity(e.target.value); setPage(1); }} className="border rounded-lg px-3 py-2 text-sm bg-white">
            <option value="">All Severity</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
          <select value={resolved} onChange={(e) => { setResolved(e.target.value); setPage(1); }} className="border rounded-lg px-3 py-2 text-sm bg-white">
            <option value="">All</option>
            <option value="false">Unresolved</option>
            <option value="true">Resolved</option>
          </select>
        </div>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <div className="bg-white rounded-xl p-8 text-center text-gray-500">Loading...</div>
        ) : errors.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center text-gray-500">No errors found</div>
        ) : (
          errors.map((err: any) => (
            <div key={err.id} className="bg-white rounded-xl shadow-sm border p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    err.severity === "CRITICAL" ? "bg-red-100" :
                    err.severity === "HIGH" ? "bg-orange-100" :
                    err.severity === "MEDIUM" ? "bg-yellow-100" :
                    "bg-gray-100"
                  }`}>
                    <Bug className={`w-4 h-4 ${
                      err.severity === "CRITICAL" ? "text-red-600" :
                      err.severity === "HIGH" ? "text-orange-600" :
                      err.severity === "MEDIUM" ? "text-yellow-600" :
                      "text-gray-600"
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                        err.severity === "CRITICAL" ? "bg-red-100 text-red-700" :
                        err.severity === "HIGH" ? "bg-orange-100 text-orange-700" :
                        err.severity === "MEDIUM" ? "bg-yellow-100 text-yellow-700" :
                        "bg-gray-100 text-gray-700"
                      }`}>{err.severity}</span>
                      <span className="text-xs text-gray-400">{err.endpoint} &middot; {err.method}</span>
                    </div>
                    <p className="text-sm font-medium text-gray-900 truncate">{err.message}</p>
                    {err.stackTrace && (
                      <pre className="text-xs text-gray-500 mt-2 bg-gray-50 p-2 rounded overflow-x-auto max-h-24">{err.stackTrace}</pre>
                    )}
                    <p className="text-xs text-gray-400 mt-2">{new Date(err.createdAt).toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  {err.resolved ? (
                    <span className="flex items-center gap-1 text-xs text-green-600">
                      <CheckCircle className="w-4 h-4" /> Resolved
                    </span>
                  ) : (
                    <button
                      onClick={() => resolveError(err.id)}
                      className="px-3 py-1.5 text-xs bg-green-500 text-white rounded-lg hover:bg-green-600"
                    >
                      Mark Resolved
                    </button>
                  )}
                </div>
              </div>
            </div>
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
