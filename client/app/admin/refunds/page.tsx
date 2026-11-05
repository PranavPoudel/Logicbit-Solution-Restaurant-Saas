//app/admin/refunds/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useMoney } from "@/hooks/use-money";
import { getPendingRefunds, processRefund, RefundRequest, RefundStatus } from "@/lib/api/refunds";

export default function RefundsPage() {
  const money = useMoney();
  const [refunds, setRefunds] = useState<RefundRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRefund, setSelectedRefund] = useState<RefundRequest | null>(null);
  const [reason, setReason] = useState("");
  const [processing, setProcessing] = useState(false);

  const loadRefunds = async () => {
    setLoading(true);
    try {
      const data = await getPendingRefunds();
      setRefunds(data);
    } catch (error) {
      console.error("Failed to load refunds:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRefunds();
  }, []);

  const handleProcess = async (status: RefundStatus) => {
    if (!selectedRefund) return;
    setProcessing(true);
    try {
      await processRefund(selectedRefund.id, status, reason);
      alert(`Refund ${status.toLowerCase()} successfully.`);
      setSelectedRefund(null);
      setReason("");
      loadRefunds();
    } catch (error) {
      console.error(`Failed to process refund:`, error);
      alert("Failed to process refund.");
    } finally {
      setProcessing(false);
    }
  };

  const totalPendingAmount = refunds.reduce(
    (sum, r) => sum + Number(r.order?.total || 0),
    0
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pending Refund Requests</h1>
          <p className="text-sm text-gray-500 mt-1">
            Review and resolve pending customer refund claims
          </p>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Pending Requests
          </p>
          <p className="text-2xl font-bold text-amber-600 mt-2">{refunds.length}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Total Pending Amount
          </p>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {money(totalPendingAmount)}
          </p>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="p-8 text-center text-gray-500 animate-pulse">
          Loading pending refund requests...
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="p-4">Order #</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Restaurant</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Payment Method</th>
                <th className="p-4">Reason</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {refunds.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-400 italic">
                    No pending refund requests found.
                  </td>
                </tr>
              ) : (
                refunds.map((refund) => (
                  <tr key={refund.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-mono font-medium text-gray-900">
                      #{refund.order?.orderNumber || refund.id.slice(-6)}
                    </td>
                    <td className="p-4 font-medium text-gray-800">
                      {refund.order?.customer?.name || "N/A"}
                    </td>
                    <td className="p-4 text-gray-600">
                      {refund.order?.restaurant?.name || "N/A"}
                    </td>
                    <td className="p-4 font-semibold text-gray-900">
                      ${Number(refund.order?.total || 0).toFixed(2)}
                    </td>
                    <td className="p-4 text-xs font-semibold text-gray-500 uppercase">
                      {refund.order?.paymentMethod || "N/A"}
                    </td>
                    <td className="p-4 text-gray-500 max-w-xs truncate" title={refund.reason}>
                      {refund.reason || "No reason given"}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedRefund(refund);
                          setReason(refund.reason || "");
                        }}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Action Modal */}
      {selectedRefund && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900">Process Refund</h3>

            <div className="bg-gray-50 p-4 rounded-xl space-y-2 text-sm border border-gray-100">
              <div className="flex justify-between">
                <span className="text-gray-500">Order Number:</span>
                <span className="font-mono font-medium">
                  #{selectedRefund.order?.orderNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Customer:</span>
                <span className="font-medium">{selectedRefund.order?.customer?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Amount:</span>
                <span className="font-bold text-gray-900">
                  ${Number(selectedRefund.order?.total || 0).toFixed(2)}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                Reason / Note
              </label>
              <textarea
                rows={3}
                placeholder="Enter process note or update reason..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setSelectedRefund(null)}
                disabled={processing}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleProcess("REJECTED")}
                disabled={processing}
                className="px-4 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors disabled:opacity-50"
              >
                Reject
              </button>
              <button
                onClick={() => handleProcess("APPROVED")}
                disabled={processing}
                className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors disabled:opacity-50"
              >
                Approve Refund
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}