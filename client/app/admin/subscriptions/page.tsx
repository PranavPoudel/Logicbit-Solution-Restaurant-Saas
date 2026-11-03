"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { listAllSubscriptions, renewRestaurantSubscription } from "@/lib/api/subscriptions";
import { listAllRestaurants, listSubscriptionPlans, assignManualSubscription } from "@/lib/api/platform-admin";

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [renewingId, setRenewingId] = useState<string | null>(null);
  

  const [selectedRestaurant, setSelectedRestaurant] = useState("");
  const [selectedPlan, setSelectedPlan] = useState("");
  const [billingMode, setBillingMode] = useState<'MANUAL' | 'AUTO'>('MANUAL');
  const [isAssigning, setIsAssigning] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [subsRes, restsRes, plansRes] = await Promise.all([
        listAllSubscriptions(),
        listAllRestaurants(1, 1000), 
        listSubscriptionPlans()
      ]);
      
      const subsArray = subsRes?.data?.data || subsRes?.data || subsRes || [];
      const restsArray = restsRes?.data?.data || restsRes?.data?.items || restsRes?.data || restsRes || [];
      const plansArray = plansRes?.data?.data || plansRes?.data || plansRes || [];

      setSubscriptions(Array.isArray(subsArray) ? subsArray : []);
      setRestaurants(Array.isArray(restsArray) ? restsArray : []);
      setPlans(Array.isArray(plansArray) ? plansArray : []);
      
      
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRenew = async (restaurantId: string, name: string) => {
    if (!window.confirm(`Force renew subscription for ${name}?`)) return;
    try {
      setRenewingId(restaurantId);
      await renewRestaurantSubscription(restaurantId);
      alert("Subscription renewed successfully!");
      await loadData();
    } catch (error: any) {
      alert(error?.response?.data?.message || "Failed to renew subscription");
    } finally {
      setRenewingId(null);
    }
  };

  const handleManualAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRestaurant || !selectedPlan) {
      return alert("Please select both a restaurant and a plan.");
    }

    try {
      setIsAssigning(true);
      await assignManualSubscription({
        restaurantId: selectedRestaurant,
        planId: selectedPlan,
        mode: billingMode
      });
      alert(`Successfully assigned plan in ${billingMode} mode!`);
      setSelectedRestaurant("");
      setSelectedPlan("");
      await loadData(); // Refresh the table
    } catch (error: any) {
      alert(error?.response?.data?.message || "Failed to assign subscription");
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-12">
      
      {/* Existing Subscriptions Table Section */}
      <section>
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
          <div className="text-gray-500 animate-pulse">Loading data...</div>
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
                        {sub.expiryDate ? new Date(sub.expiryDate).toLocaleDateString() : 'Lifetime'}
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
      </section>

{/* Subscription Assignment Section */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900">Subscription Assignment Setup</h2>
          <p className="text-sm text-gray-500 mt-1">
            Toggle between manual admin overrides and automated gateway handling.
          </p>
        </div>

        {/* Mode Toggle - Now at the top */}
        <div className="mb-6">
          <div className="flex bg-gray-100 p-1 rounded-lg w-fit">
            <button
              type="button"
              onClick={() => setBillingMode('MANUAL')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
                billingMode === 'MANUAL' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Manual Override
            </button>
            <button
              type="button"
              onClick={() => setBillingMode('AUTO')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
                billingMode === 'AUTO' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Auto (Gateway)
            </button>
          </div>
        </div>

        {/* Conditional Rendering based on Mode */}
        {billingMode === 'MANUAL' ? (
          <form onSubmit={handleManualAssignment} className="space-y-6 max-w-2xl animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Restaurant Selector */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Select Restaurant</label>
                <select 
                  required
                  value={selectedRestaurant}
                  onChange={(e) => setSelectedRestaurant(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="" disabled>-- Choose a restaurant --</option>
                  {restaurants.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>

              {/* Plan Selector */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Select Plan</label>
                <select 
                  required
                  value={selectedPlan}
                  onChange={(e) => setSelectedPlan(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="" disabled>-- Choose a plan --</option>
                  {plans.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.durationMonths === 0 ? 'Lifetime' : `${p.durationMonths} Months`}) - NPR {p.price}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button 
              type="submit"
              disabled={isAssigning || !selectedRestaurant || !selectedPlan}
              className="bg-gray-900 hover:bg-gray-800 text-white font-medium py-2.5 px-6 rounded-lg transition-colors text-sm disabled:opacity-50"
            >
              {isAssigning ? "Assigning Plan..." : "Confirm Manual Assignment"}
            </button>
          </form>
        ) : (
          <div className="max-w-2xl bg-blue-50/50 border border-blue-100 rounded-lg p-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h3 className="text-sm font-semibold text-blue-900 mb-1">Automated Gateway Mode Active</h3>
            <p className="text-sm text-blue-700 leading-relaxed">
              No manual assignment is required. The restaurant will select their plan, handle payments, and manage renewals directly through the integrated online payment gateway on their own dashboard.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}