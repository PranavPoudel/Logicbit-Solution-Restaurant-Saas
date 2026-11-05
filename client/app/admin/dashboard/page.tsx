//app/admin/dashboard/page.tsx
"use client";
import Link from "next/link";
import { useMoney } from "@/hooks/use-money";

export default function AdminDashboardPage() {
  const money = useMoney();
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Platform Overview</h1>
        <p className="text-sm text-gray-500 mt-1">Welcome to the Platform Administration Console.</p>
      </div>

      {/* Revenue & Stats Summary (Ready to be wired to the backend we built!) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-sm font-medium text-gray-500 mb-1">Total Platform Revenue</p>
          <p className="text-3xl font-bold text-gray-900">{money(0)}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-sm font-medium text-gray-500 mb-1">Active Subscriptions</p>
          <p className="text-3xl font-bold text-gray-900">0</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-sm font-medium text-gray-500 mb-1">Pending Settlements</p>
          <p className="text-3xl font-bold text-gray-900">0</p>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Management</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link 
            href="/admin/staff" 
            className="p-5 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-blue-500 hover:shadow-md transition-all group"
          >
            <h3 className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">Staff Management</h3>
            <p className="text-xs text-gray-500 mt-1">View and create administrative staff</p>
          </Link>

          <Link 
            href="/admin/roles" 
            className="p-5 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-blue-500 hover:shadow-md transition-all group"
          >
            <h3 className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">Roles & Permissions</h3>
            <p className="text-xs text-gray-500 mt-1">Configure permission groups</p>
          </Link>

          <Link 
            href="/admin/cuisines" 
            className="p-5 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-blue-500 hover:shadow-md transition-all group"
          >
            <h3 className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">Cuisine Management</h3>
            <p className="text-xs text-gray-500 mt-1">Manage platform-wide cuisine categories</p>
          </Link>

          <Link 
            href="/admin/subscriptions/plans" 
            className="p-5 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-blue-500 hover:shadow-md transition-all group"
          >
            <h3 className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">Subscription Plans</h3>
            <p className="text-xs text-gray-500 mt-1">Configure pricing tiers for restaurants</p>
          </Link>

          <Link 
            href="/admin/advertisements" 
            className="p-5 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-blue-500 hover:shadow-md transition-all group"
          >
            <h3 className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">Advertisements</h3>
            <p className="text-xs text-gray-500 mt-1">Approve or reject banner campaigns</p>
          </Link>

          <Link 
            href="/admin/settlements" 
            className="p-5 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-blue-500 hover:shadow-md transition-all group"
          >
            <h3 className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">Settlements</h3>
            <p className="text-xs text-gray-500 mt-1">Generate payout settlements</p>
          </Link>
        </div>
      </div>
    </div>
  );
}