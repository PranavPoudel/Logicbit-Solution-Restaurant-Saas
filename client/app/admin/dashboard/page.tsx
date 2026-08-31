"use client";
import Link from "next/link";

export default function AdminDashboardPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Platform Overview</h1>
        <p className="text-sm text-gray-500 mt-1">Welcome to the Platform Administration Console.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link 
          href="/admin/staff" 
          className="p-5 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-blue-500 transition-all"
        >
          <h3 className="font-semibold text-gray-800">Staff Management</h3>
          <p className="text-xs text-gray-500 mt-1">View and create administrative staff</p>
        </Link>

        <Link 
          href="/admin/roles" 
          className="p-5 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-blue-500 transition-all"
        >
          <h3 className="font-semibold text-gray-800">Roles & Permissions</h3>
          <p className="text-xs text-gray-500 mt-1">Configure permission groups</p>
        </Link>

        <Link 
          href="/admin/cuisines" 
          className="p-5 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-blue-500 transition-all"
        >
          <h3 className="font-semibold text-gray-800">Cuisine Management</h3>
          <p className="text-xs text-gray-500 mt-1">Manage platform-wide cuisine categories</p>
        </Link>

        <Link 
          href="/admin/subscriptions/plans" 
          className="p-5 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-blue-500 transition-all"
        >
          <h3 className="font-semibold text-gray-800">Subscription Plans</h3>
          <p className="text-xs text-gray-500 mt-1">Configure pricing tiers for restaurants</p>
        </Link>

        <Link 
          href="/admin/advertisements" 
          className="p-5 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-blue-500 transition-all"
        >
          <h3 className="font-semibold text-gray-800">Advertisements</h3>
          <p className="text-xs text-gray-500 mt-1">Approve or reject banner campaigns</p>
        </Link>

        <Link 
          href="/admin/settlements" 
          className="p-5 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-blue-500 transition-all"
        >
          <h3 className="font-semibold text-gray-800">Settlements</h3>
          <p className="text-xs text-gray-500 mt-1">Generate payout settlements</p>
        </Link>
      </div>
    </div>
  );
}