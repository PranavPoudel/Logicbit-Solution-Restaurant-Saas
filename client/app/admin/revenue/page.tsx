"use client";

import { useEffect, useState } from "react";
import { getRevenueSummary, RevenueSummary } from "@/lib/api/revenue";

export default function RevenuePage() {
  const [summary, setSummary] = useState<RevenueSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await getRevenueSummary();
        setSummary(data);
      } catch (error) {
        console.error("Failed to load revenue summary:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-gray-500 animate-pulse">Loading revenue data...</div>;
  }

  if (!summary) {
    return <div className="p-8 text-center text-red-500">Failed to load revenue data.</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Platform Revenue</h1>
        <p className="text-sm text-gray-500 mt-1">Track subscription income and monthly recurring revenue (MRR)</p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Total Revenue (All Time)</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">Rs. {summary.totalRevenue.toFixed(2)}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">MRR</h3>
          <p className="text-3xl font-bold text-emerald-600 mt-2">Rs. {summary.mrr.toFixed(2)}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Active Subscriptions</h3>
          <p className="text-3xl font-bold text-blue-600 mt-2">{summary.activeSubscriptions}</p>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <h2 className="font-semibold text-gray-800">Recent Subscription Payments</h2>
        </div>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <th className="p-4">Date</th>
              <th className="p-4">Restaurant</th>
              <th className="p-4">Plan</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {summary.recentTransactions.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-400 italic">No recent transactions found.</td>
              </tr>
            ) : (
              summary.recentTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 text-gray-600">{new Date(tx.date).toLocaleDateString()}</td>
                  <td className="p-4 font-medium text-gray-900">{tx.restaurantName}</td>
                  <td className="p-4 text-gray-600">{tx.planName}</td>
                  <td className="p-4">
                    <span className="inline-block px-2 py-1 text-[10px] font-bold uppercase rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {tx.status}
                    </span>
                  </td>
                  <td className="p-4 font-bold text-gray-900 text-right">Rs. {Number(tx.amount).toFixed(2)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}