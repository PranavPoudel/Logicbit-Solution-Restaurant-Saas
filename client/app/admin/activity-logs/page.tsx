"use client";

import { useEffect, useState } from "react";
import { getAllActivityLogs, getOwnersOverview } from "@/lib/api/platform-admin";

interface ActivityLog {
  id: string;
  restaurantId: string | null;
  actorType: string;
  action: string;
  description: string;
  createdAt: string;
}

const LIMIT = 50;

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loadedPage, setLoadedPage] = useState(0);
  const [restaurantNames, setRestaurantNames] = useState<Record<string, string>>({});

  useEffect(() => {
    getOwnersOverview()
      .then((owners) =>
        setRestaurantNames(Object.fromEntries(owners.flatMap((o) => o.restaurants.map((r) => [r.id, r.name]))))
      )
      .catch((error) => console.error("Failed to load restaurants:", error));
  }, []);

  useEffect(() => {
    getAllActivityLogs(page, LIMIT)
      .then((res) => {
        const data = res?.data || res;
        setLogs(data.logs ?? []);
        setTotal(data.pagination?.total ?? 0);
      })
      .catch((error) => console.error("Failed to load activity logs:", error))
      .finally(() => setLoadedPage(page));
  }, [page]);

  const loading = loadedPage !== page;
  const pages = Math.max(1, Math.ceil(total / LIMIT));

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Activity Logs</h1>
        <p className="text-sm text-gray-500 mt-1">Everything that happens across the platform, newest first.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
        <table className="w-full text-left min-w-[800px]">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <th className="p-4">Time</th>
              <th className="p-4">Who</th>
              <th className="p-4">Restaurant</th>
              <th className="p-4">Action</th>
              <th className="p-4">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {loading ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-400 animate-pulse">Loading logs...</td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-400 italic">No activity found.</td>
              </tr>
            ) : (
              logs.map((l) => (
                <tr key={l.id} className="hover:bg-gray-50">
                  <td className="p-4 text-gray-600 whitespace-nowrap">{new Date(l.createdAt).toLocaleString()}</td>
                  <td className="p-4 text-gray-600">{l.actorType}</td>
                  <td className="p-4 text-gray-600">{(l.restaurantId && restaurantNames[l.restaurantId]) || "—"}</td>
                  <td className="p-4">
                    <span className="px-2 py-1 text-xs font-medium rounded-md bg-gray-100 text-gray-700">{l.action}</span>
                  </td>
                  <td className="p-4 text-gray-900">{l.description}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>{total.toLocaleString()} entries</span>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setPage((p) => p - 1)}
            disabled={page <= 1}
            className="px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40"
          >
            Previous
          </button>
          <span>Page {page} of {pages}</span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= pages}
            className="px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
