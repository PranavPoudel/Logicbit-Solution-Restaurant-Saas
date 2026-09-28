"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { listSubscriptionPlans, SubscriptionPlan } from "@/lib/api/subscriptions";

export default function PlansPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPlans = async () => {
      try {
        const data = await listSubscriptionPlans();
   
        const plansArray = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []);
        setPlans(plansArray);
      } catch (error) {
        console.error("Failed to load plans:", error);
      } finally {
        setLoading(false);
      }
    };
    loadPlans();
  }, []);

  return (
    <div className="p-6 max-w-5xl">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Subscription Plans</h2>
          <p className="text-sm text-gray-500 mt-1">Manage the pricing tiers available to restaurants</p>
        </div>

        <Link 
          href="/admin/subscriptions/plans/create"
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm whitespace-nowrap"
        >
          + Create New Plan
        </Link>
      </div>

      {loading ? (
        <div className="text-gray-500 animate-pulse">Loading plans...</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-sm">
                <th className="p-4 font-semibold text-gray-600">Plan Name</th>
                <th className="p-4 font-semibold text-gray-600">Monthly Price</th>
                <th className="p-4 font-semibold text-gray-600">Duration (Days)</th>
                <th className="p-4 font-semibold text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody>
              {plans.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500">
                    No subscription plans found. Create one!
                  </td>
                </tr>
              ) : (
                plans.map((plan) => (
                  <tr key={plan.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                    <td className="p-4 text-sm font-medium text-gray-900">
                      {plan.name}
                    </td>
                    <td className="p-4 text-sm text-gray-600">
                
                      ${Number(plan.priceMonthly || 0).toFixed(2)}
                    </td>
                    <td className="p-4 text-sm text-gray-600">
                      {plan.durationDays || "30 (Default)"}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        plan.isActive !== false 
                          ? "bg-green-100 text-green-700" 
                          : "bg-red-100 text-red-700"
                      }`}>
                        {plan.isActive !== false ? "Active" : "Inactive"}
                      </span>
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