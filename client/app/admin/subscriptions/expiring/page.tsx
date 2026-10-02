"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { listExpiringSoonSubscriptions, renewRestaurantSubscription } from "@/lib/api/subscriptions";

export default function ExpiringSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [renewingId, setRenewingId] = useState<string | null>(null);

  const loadSubscriptions = async () => {
    try {
      setLoading(true);
      const data = await listExpiringSoonSubscriptions();
      setSubscriptions(Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []));
    } catch (error) {
      console.error("Failed to load expiring subscriptions:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubscriptions();
  }, []);

  const handleRenew = async (restaurantId: string, name: string) => {
    if (!window.confirm(`Renew subscription for ${name}?`)) return;

    try {
      setRenewingId(restaurantId);
      await renewRestaurantSubscription(restaurantId);
      alert("Subscription renewed successfully!");
      await loadSubscriptions(); // refresh list
    } catch (error: any) {
      alert(error?.response?.data?.message || "Failed to renew subscription");
    } finally {
      setRenewingId(null);
    }
  };

  return (
    <div className="p-6 max-w-6xl">
      <div className="mb-8">
        <Link href="/admin/subscriptions" className="text-sm text-blue-600 hover:underline mb-2 inline-block">
          &larr; Back to All Subscriptions
        </Link>
        <h2 className="text-2xl font-bold text-gray-900">Expiring Soon</h2>
        <p className="text-sm text-gray-500 mt-1">Restaurants whose subscriptions expire within the next 7-14 days.</p>
      </div>

      {loading ? (
        <div className="text-gray-500 animate-pulse">Loading expiring subscriptions...</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-red-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-red-50 border-b border-red-100 text-sm">
                <th className="p-4 font-semibold text-gray-700">Restaurant</th>
                <th className="p-4 font-semibold text-gray-700">Plan</th>
                <th className="p-4 font-semibold text-gray-700">End Date</th>
                <th className="p-4 font-semibold text-gray-700">Status</th>
                <th className="p-4 font-semibold text-gray-700 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">
                    No subscriptions are expiring soon.
                  </td>
                </tr>
              ) : (
                subscriptions.map((sub) => {
                  // Calculate days remaining just for visual aid
                  const daysLeft = Math.ceil((new Date(sub.endDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
                  
                  return (
                    <tr key={sub.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                      <td className="p-4 text-sm font-medium text-gray-900">
                        {sub.restaurantName || `Rest ID: ${sub.restaurantId.substring(0,8)}`}
                      </td>
                      <td className="p-4 text-sm text-gray-600">
                        {sub.planName || sub.plan?.name || "Standard Plan"}
                      </td>
                      <td className="p-4 text-sm">
                        <span className="text-gray-900">{new Date(sub.endDate).toLocaleDateString()}</span>
                        <span className="ml-2 text-xs font-medium text-red-600">
                          ({daysLeft > 0 ? `${daysLeft} days left` : 'Expired'})
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          sub.status === 'ACTIVE' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                        }`}>
                          {sub.status || "UNKNOWN"}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleRenew(sub.restaurantId, sub.restaurantName || sub.restaurantId)}
                          disabled={renewingId === sub.restaurantId}
                          className="text-sm font-medium px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                          {renewingId === sub.restaurantId ? "Renewing..." : "Renew Now"}
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}