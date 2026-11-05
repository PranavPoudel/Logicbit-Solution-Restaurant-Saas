//app/admin/restaurants/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  listAllRestaurants, 
  suspendRestaurant, 
  setRestaurantCommission 
} from "@/lib/api/platform-admin";

export default function PlatformRestaurantsPage() {
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Commission Modal State
  const [commModal, setCommModal] = useState<{ isOpen: boolean; restId: string; current: number }>({ isOpen: false, restId: "", current: 0 });
  const [newCommission, setNewCommission] = useState("");

  const loadRestaurants = async () => {
    try {
      setLoading(true);
      const data = await listAllRestaurants(1, 100);
      const items = Array.isArray(data) ? data : (data?.items || data?.data || []);
      setRestaurants(items);
    } catch (error) {
      console.error("Failed to load restaurants", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRestaurants();
  }, []);

  const handleToggleSuspend = async (id: string, currentlySuspended: boolean) => {
    const action = currentlySuspended ? "activate" : "suspend";
    if (!confirm(`Are you sure you want to ${action} this restaurant?`)) return;
    
    try {
      await suspendRestaurant(id, !currentlySuspended);
      await loadRestaurants();
    } catch (error: any) {
      alert(error?.response?.data?.message || `Failed to ${action} restaurant`);
    }
  };

  const handleSaveCommission = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await setRestaurantCommission(commModal.restId, parseFloat(newCommission));
      setCommModal({ isOpen: false, restId: "", current: 0 });
      await loadRestaurants();
    } catch (error: any) {
      alert(error?.response?.data?.message || "Failed to update commission");
    }
  };

  return (
    <div className="p-6 max-w-7xl">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Restaurants Management</h2>
        <p className="text-sm text-gray-500 mt-1">Monitor, suspend, or adjust commissions for all vendors.</p>
      </div>

      {loading ? (
        <div className="animate-pulse text-gray-500">Loading restaurants...</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
          <table className="w-full text-left min-w-[800px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="p-4 text-sm font-semibold text-gray-600">Restaurant</th>
                <th className="p-4 text-sm font-semibold text-gray-600">Status</th>
                <th className="p-4 text-sm font-semibold text-gray-600">Commission</th>
                <th className="p-4 text-sm font-semibold text-gray-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {restaurants.map((rest) => (
                <tr key={rest.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-4">
                    <p className="font-medium text-gray-900">{rest.name}</p>
                    <p className="text-xs text-gray-500">{rest.city || "No city"} • {rest.id.substring(0,8)}</p>
                  </td>
                  <td className="p-4">
                    {rest.isSuspended ? (
                      <span className="px-2 py-1 text-xs font-medium rounded-md bg-red-100 text-red-700">Suspended</span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-medium rounded-md bg-green-100 text-green-700">Active</span>
                    )}
                  </td>
                  <td className="p-4 text-sm text-gray-900">
                    {rest.commissionRate ?? 0}%
                    <button 
                      onClick={() => {
                        setCommModal({ isOpen: true, restId: rest.id, current: rest.commissionRate ?? 0 });
                        setNewCommission(String(rest.commissionRate ?? 0));
                      }}
                      className="ml-3 text-xs text-blue-600 hover:underline"
                    >
                      Edit
                    </button>
                  </td>
                  <td className="p-4 text-right space-x-3">
                    <button 
                      onClick={() => handleToggleSuspend(rest.id, !!rest.isSuspended)}
                      className={`text-sm font-medium ${rest.isSuspended ? "text-green-600" : "text-red-600"} hover:underline`}
                    >
                      {rest.isSuspended ? "Activate" : "Suspend"}
                    </button>
                    <Link href={`/admin/restaurants/${rest.id}`} className="text-sm font-medium text-blue-600 hover:underline">
                      View Details &rarr;
                    </Link>
                  </td>
                </tr>
              ))}
              {restaurants.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500">No restaurants found on the platform.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* COMMISSION MODAL */}
      {commModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold mb-2">Update Commission</h3>
            <p className="text-sm text-gray-500 mb-4">Set the platform fee percentage for this vendor.</p>
            <form onSubmit={handleSaveCommission}>
              <div className="relative mb-6">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  required
                  value={newCommission}
                  onChange={(e) => setNewCommission(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 pr-8"
                />
                <span className="absolute right-3 top-2.5 text-gray-500">%</span>
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setCommModal({ isOpen: false, restId: "", current: 0 })} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg">Update Rate</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}