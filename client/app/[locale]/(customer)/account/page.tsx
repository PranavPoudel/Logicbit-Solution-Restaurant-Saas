// app/(customer)/account/page.tsx
"use client";

import { use, useState } from "react";
import { Heart, LogOut, MapPin, ReceiptText, User, Wallet } from "lucide-react";
import { CustomerAuthGuard } from "@/components/auth/customer-auth-guard";
import { AccountTabs } from "@/components/account/account-tabs";
import { ProfileTab } from "@/components/account/profile-tab";
import { AddressesTab } from "@/components/account/addresses-tab";
import { OrderHistoryTab } from "@/components/account/order-history-tab";
import { TransactionsTab } from "@/components/account/transactions-tab";
import { FavoritesTab } from "@/components/account/favorites-tab";
import { useCustomerAuthStore } from "@/store/customer-auth-store";

const TABS = [
  { key: "profile", label: "Profile", Icon: User, description: "Your name and contact details." },
  { key: "addresses", label: "Addresses", Icon: MapPin, description: "Saved places for faster checkout." },
  { key: "orders", label: "Order history", Icon: ReceiptText, description: "Track current orders and revisit past ones." },
  { key: "transactions", label: "Transactions", Icon: Wallet, description: "Payments and refunds across all your orders." },
  { key: "favorites", label: "Favorites", Icon: Heart, description: "Restaurants you've saved." },
];

export default function AccountPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = use(searchParams);
  const [activeTab, setActiveTab] = useState(TABS.some((t) => t.key === tab) ? tab! : "profile");
  const customer = useCustomerAuthStore((s) => s.customer);
  const logout = useCustomerAuthStore((s) => s.logout);
  const active = TABS.find((t) => t.key === activeTab) ?? TABS[0];

  return (
    <CustomerAuthGuard>
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-6 md:py-10">
        <header className="mb-6 flex items-center justify-between gap-4 border-b border-[#E8E7E2] pb-6 md:mb-8">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#17181C] text-lg font-semibold text-white md:h-14 md:w-14">
              {(customer?.name ?? "?").charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h1 className="font-display text-2xl font-semibold text-[#17181C] md:text-3xl">Your account</h1>
              <p className="truncate text-sm text-neutral-500">
                {customer?.name}
                {customer?.email ? ` · ${customer.email}` : ""}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex min-h-11 shrink-0 items-center gap-2 rounded-xl border border-red-200 px-4 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
          >
            <LogOut size={16} />
            Log out
          </button>
        </header>

        <div className="md:flex md:items-start md:gap-12">
          <AccountTabs tabs={TABS} activeKey={activeTab} onSelect={setActiveTab} />

          <div key={activeTab} className="min-w-0 flex-1">
            <div className="animate-fade-up mb-5 mt-5 md:mt-0">
              <h2 className="text-xl font-semibold text-[#17181C]">{active.label}</h2>
              <p className="mt-1 text-sm text-neutral-500">{active.description}</p>
            </div>

            {activeTab === "profile" && <ProfileTab />}
            {activeTab === "addresses" && <AddressesTab />}
            {activeTab === "orders" && <OrderHistoryTab />}
            {activeTab === "transactions" && <TransactionsTab />}
            {activeTab === "favorites" && <FavoritesTab />}
          </div>
        </div>
      </div>
    </CustomerAuthGuard>
  );
}
