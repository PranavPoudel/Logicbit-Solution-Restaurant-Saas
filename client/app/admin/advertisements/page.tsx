"use client";

import { useEffect, useState, FormEvent } from "react";
import { 
  listPendingAdvertisements, 
  approveAdvertisement, 
  rejectAdvertisement, 
  Advertisement 
} from "@/lib/api/advertisements";

export default function AdvertisementsPage() {
  const [advertisements, setAdvertisements] = useState<Advertisement[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals state
  const [approveModal, setApproveModal] = useState<{ isOpen: boolean; adId: string }>({ isOpen: false, adId: "" });
  const [rejectModal, setRejectModal] = useState<{ isOpen: boolean; adId: string }>({ isOpen: false, adId: "" });
  
  // Form states
  const [amountPaid, setAmountPaid] = useState<string>("");
  const [priority, setPriority] = useState<string>("0");
  const [rejectReason, setRejectReason] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadAds = async () => {
    try {
      setLoading(true);
      const data = await listPendingAdvertisements();
      setAdvertisements(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load advertisements:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAds();
  }, []);

  const handleApproveSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!amountPaid) return;

    try {
      setIsSubmitting(true);
      await approveAdvertisement(approveModal.adId, { 
        amountPaid: parseFloat(amountPaid), 
        priority: priority ? parseInt(priority, 10) : undefined 
      });
      setApproveModal({ isOpen: false, adId: "" });
      setAmountPaid("");
      setPriority("0");
      await loadAds();
    } catch (error: any) {
      alert(error?.response?.data?.message || "Failed to approve advertisement");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await rejectAdvertisement(rejectModal.adId, rejectReason || undefined);
      setRejectModal({ isOpen: false, adId: "" });
      setRejectReason("");
      await loadAds();
    } catch (error: any) {
      alert(error?.response?.data?.message || "Failed to reject advertisement");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl relative">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Pending Advertisements</h2>
        <p className="text-sm text-gray-500 mt-1">Review promotional campaigns requested by restaurants.</p>
      </div>

      {loading ? (
        <div className="text-gray-500 animate-pulse">Loading pending advertisements...</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-sm">
                <th className="p-4 font-semibold text-gray-600">Promotion</th>
                <th className="p-4 font-semibold text-gray-600">Placement</th>
                <th className="p-4 font-semibold text-gray-600">Duration</th>
                <th className="p-4 font-semibold text-gray-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {advertisements.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500">
                    No pending advertisements to review. Great job!
                  </td>
                </tr>
              ) : (
                advertisements.map((ad) => (
                  <tr key={ad.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {ad.imageUrl ? (
                          <img src={ad.imageUrl} alt={ad.title} className="w-12 h-12 rounded-lg object-cover border border-gray-200" />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400 text-xs">
                            No Img
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-900">{ad.title}</p>
                          <p className="text-xs text-gray-500 truncate max-w-[200px]">
                            {ad.restaurantId ? `Rest ID: ${ad.restaurantId.substring(0, 8)}...` : "Unknown Restaurant"}
                          </p>
                          {ad.linkUrl && (
                            <a href={ad.linkUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline">
                              Target Link &rarr;
                            </a>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-1 text-xs font-medium rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {ad.placementType.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-gray-600">
                      <div className="flex flex-col">
                        <span>{new Date(ad.startDate).toLocaleDateString()}</span>
                        <span className="text-gray-400 text-xs">to</span>
                        <span>{new Date(ad.endDate).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setRejectModal({ isOpen: true, adId: ad.id })}
                          className="px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => setApproveModal({ isOpen: true, adId: ad.id })}
                          className="px-3 py-1.5 text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-md transition-colors"
                        >
                          Approve...
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* APPROVE MODAL */}
      {approveModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Approve Advertisement</h3>
            <form onSubmit={handleApproveSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount Paid (USD) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority (Optional)
                </label>
                <input
                  type="number"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0 (higher is better)"
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setApproveModal({ isOpen: false, adId: "" })}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !amountPaid}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg disabled:opacity-50"
                >
                  {isSubmitting ? "Approving..." : "Confirm Approval"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REJECT MODAL */}
      {rejectModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Reject Advertisement</h3>
            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rejection Reason (Optional)
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 min-h-[100px]"
                  placeholder="Tell the restaurant why this was rejected..."
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setRejectModal({ isOpen: false, adId: "" })}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50"
                >
                  {isSubmitting ? "Rejecting..." : "Confirm Rejection"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}