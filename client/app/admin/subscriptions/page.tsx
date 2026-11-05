//app/admin/subscriptions/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { listAllSubscriptions, renewRestaurantSubscription } from "@/lib/api/subscriptions";

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [renewingId, setRenewingId] = useState<string | null>(null);

  const loadSubscriptions = async () => {
    try {
      setLoading(true);
      const data = await listAllSubscriptions();
      setSubscriptions(Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []));
    } catch (error) {
      console.error("Failed to load subscriptions:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubscriptions();
  }, []);

  const handleRenew = async (restaurantId: string, name: string) => {
    if (!window.confirm(`Force renew subscription for ${name}?`)) return;

    try {
      setRenewingId(restaurantId);
      await renewRestaurantSubscription(restaurantId);
      alert("Subscription renewed successfully!");
      await loadSubscriptions();
    } catch (error: any) {
      alert(error?.response?.data?.message || "Failed to renew subscription");
    } finally {
      setRenewingId(null);
    }
  };

  return (
    <div className="p-6 max-w-6xl">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">All Subscriptions</h2>
          <p className="text-sm text-gray-500 mt-1">Monitor restaurant billing and subscription statuses</p>
        </div>

        <div className="flex gap-3">
          <Link 
            href="/admin/subscriptions/expiring"
            className="bg-yellow-50 hover:bg-yellow-100 text-yellow-700 font-medium py-2 px-4 rounded-lg transition-colors border border-yellow-200 text-sm"
          >
            View Expiring Soon
          </Link>
          <Link 
            href="/admin/subscriptions/plans"
            className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-4 rounded-lg transition-colors border border-gray-200 text-sm"
          >
            Manage Plans
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="text-gray-500 animate-pulse">Loading subscriptions...</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-sm">
                <th className="p-4 font-semibold text-gray-600">Restaurant</th>
                <th className="p-4 font-semibold text-gray-600">Plan</th>
                <th className="p-4 font-semibold text-gray-600">Start Date</th>
                <th className="p-4 font-semibold text-gray-600">End Date</th>
                <th className="p-4 font-semibold text-gray-600">Status</th>
                <th className="p-4 font-semibold text-gray-600 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    No subscriptions found.
                  </td>
                </tr>
              ) : (
                subscriptions.map((sub) => (
                  <tr key={sub.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                    <td className="p-4 text-sm font-medium text-gray-900">
                      {sub.restaurantName || `Rest ID: ${sub.restaurantId.substring(0,8)}`}
                    </td>
                    <td className="p-4 text-sm text-gray-600">
                      {sub.planName || sub.plan?.name || "Standard Plan"}
                    </td>
                    <td className="p-4 text-sm text-gray-600">
                      {new Date(sub.startDate).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-sm text-gray-600">
                      {new Date(sub.endDate).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        sub.status === 'ACTIVE' ? "bg-green-100 text-green-700" : 
                        sub.status === 'EXPIRED' ? "bg-red-100 text-red-700" :
                        "bg-gray-100 text-gray-700"
                      }`}>
                        {sub.status || "UNKNOWN"}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleRenew(sub.restaurantId, sub.restaurantName || sub.restaurantId)}
                        disabled={renewingId === sub.restaurantId}
                        className="text-sm font-medium px-3 py-1.5 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors disabled:opacity-50"
                      >
                        {renewingId === sub.restaurantId ? "Renewing..." : "Force Renew"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}