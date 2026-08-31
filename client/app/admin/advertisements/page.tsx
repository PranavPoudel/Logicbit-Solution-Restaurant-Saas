"use client";
import { useEffect, useState } from "react";
import { platformApiClient } from "@/lib/api/platform-client";

export default function AdvertisementsPage() {
  const [ads, setAds] = useState<any[]>([]);

  const loadAds = async () => {
    try {
      const { data } = await platformApiClient.get("/platform-admin/advertisements");
      setAds(data?.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadAds();
  }, []);

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    try {
      const payload = action === 'reject' ? { rejectionReason: prompt("Reason?") } : {};
      await platformApiClient.patch(`/platform-admin/advertisements/${id}/${action}`, payload);
      loadAds();
    } catch (err) {
      alert(`Failed to ${action} ad`);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Advertisements</h2>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="p-4 font-semibold text-gray-600">Title</th>
              <th className="p-4 font-semibold text-gray-600">Status</th>
              <th className="p-4 font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {ads.map((ad) => (
              <tr key={ad.id} className="border-b border-gray-100 last:border-0">
                <td className="p-4">{ad.title}</td>
                <td className="p-4">{ad.status}</td>
                <td className="p-4 space-x-2">
                  <button onClick={() => handleAction(ad.id, 'approve')} className="text-sm bg-green-500 text-white px-3 py-1 rounded">Approve</button>
                  <button onClick={() => handleAction(ad.id, 'reject')} className="text-sm bg-red-500 text-white px-3 py-1 rounded">Reject</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}