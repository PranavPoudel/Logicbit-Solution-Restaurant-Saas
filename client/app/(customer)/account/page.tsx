// app/(customer)/account/page.tsx
"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { CustomerAuthGuard } from "@/components/auth/customer-auth-guard";
import { AccountTabs } from "@/components/account/account-tabs";
import { ProfileTab } from "@/components/account/profile-tab";
import { AddressesTab } from "@/components/account/addresses-tab";
import { OrderHistoryTab } from "@/components/account/order-history-tab";
import { FavoritesTab } from "@/components/account/favorites-tab";
import { useCustomerAuthStore } from "@/store/customer-auth-store";

const TABS = [
  { key: "profile", label: "Profile" },
  { key: "addresses", label: "Addresses" },
  { key: "orders", label: "Order history" },
  { key: "favorites", label: "Favorites" },
];

export default function AccountPage() {
  const [activeTab, setActiveTab] = useState("profile");
  const logout = useCustomerAuthStore((s) => s.logout);

  return (
    <CustomerAuthGuard>
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="font-display font-semibold text-xl text-[#17181C]">Your account</h1>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 text-sm text-red-600"
          >
            <LogOut size={14} />
            Log out
          </button>
        </div>

        <AccountTabs tabs={TABS} activeKey={activeTab} onSelect={setActiveTab} />

        {activeTab === "profile" && <ProfileTab />}
        {activeTab === "addresses" && <AddressesTab />}
        {activeTab === "orders" && <OrderHistoryTab />}
        {activeTab === "favorites" && <FavoritesTab />}
      </div>
    </CustomerAuthGuard>
  );
}
