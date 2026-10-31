"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { listPendingPromotions, reviewPendingPromotion } from "@/lib/api/platform-admin";

export default function PendingPromotionsPage() {
  const [pending, setPending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPending();
  }, []);

  const loadPending = async () => {
    try {
      setLoading(true);
      const data = await listPendingPromotions();
      setPending(data?.data || data || []);
    } catch (err: any) {
      console.error("Failed to load pending promotions:", err);
      setError("Failed to load pending promotions.");
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (couponId: string, status: "APPROVED" | "REJECTED") => {
    try {
      await reviewPendingPromotion(couponId, status);
      // Remove the reviewed item from the UI queue
      setPending((prev) => prev.filter((p) => p.id !== couponId));
    } catch (err) {
      console.error(`Failed to ${status.toLowerCase()} promotion:`, err);
      alert(`Failed to ${status.toLowerCase()} promotion. Please try again.`);
    }
  };

  if (loading) {
    return <div className="p-8 text-gray-500 animate-pulse">Loading pending requests...</div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pending Promotion Exceptions</h1>
          <p className="text-sm text-gray-500 mt-1">
            Review coupons that exceed restaurant discount limits.
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {pending.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No pending promotions require review at this time.
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-600">
              <tr>
                <th className="p-4 font-semibold">Restaurant</th>
                <th className="p-4 font-semibold">Code / Type</th>
                <th className="p-4 font-semibold">Requested Value</th>
                <th className="p-4 font-semibold">Limit Exceeded</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {pending.map((promo) => (
                <tr key={promo.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4">
                    <Link 
                      href={`/admin/restaurants/${promo.restaurantId}`} 
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {promo.restaurant?.name || "Unknown Restaurant"}
                    </Link>
                  </td>
                  <td className="p-4">
                    <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                      {promo.code || "AUTO-APPLY"}
                    </span>
                    <span className="block text-xs text-gray-500 mt-1">
                      {promo.type}
                    </span>
                  </td>
                  <td className="p-4 font-semibold text-gray-900">
                    {promo.type === "PERCENTAGE" ? `${promo.value}%` : `$${promo.value}`}
                  </td>
                  <td className="p-4 text-red-600">
                    <span className="text-xs uppercase font-bold tracking-wider">
                      Over Cap
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-3">
                    <button
                      onClick={() => handleReview(promo.id, "REJECTED")}
                      className="text-red-600 hover:text-red-800 font-medium px-3 py-1 rounded border border-red-200 hover:bg-red-50 transition-colors"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleReview(promo.id, "APPROVED")}
                      className="bg-green-600 text-white hover:bg-green-700 font-medium px-4 py-1.5 rounded transition-colors"
                    >
                      Approve
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}