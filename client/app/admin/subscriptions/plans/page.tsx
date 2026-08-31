"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { platformApiClient } from "@/lib/api/platform-client";

export default function PlansPage() {
  const [plans, setPlans] = useState<any[]>([]);

  useEffect(() => {
    platformApiClient.get("/platform-admin/plans")
      .then((res) => setPlans(res.data?.data || []))
      .catch(console.error);
  }, []);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Subscription Plans</h2>
        <Link href="/admin/subscriptions/plans/create" className="bg-blue-600 text-white px-4 py-2 rounded-lg">
          Add Plan
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="p-4 font-semibold text-gray-600">Plan Name</th>
              <th className="p-4 font-semibold text-gray-600">Price</th>
              <th className="p-4 font-semibold text-gray-600">Duration</th>
            </tr>
          </thead>
          <tbody>
            {plans.map((plan) => (
              <tr key={plan.id} className="border-b border-gray-100 last:border-0">
                <td className="p-4">{plan.name}</td>
                <td className="p-4">${plan.price}</td>
                <td className="p-4">{plan.durationMonths} Months</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}