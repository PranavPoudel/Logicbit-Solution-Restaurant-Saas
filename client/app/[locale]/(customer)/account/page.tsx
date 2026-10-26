// app/(customer)/account/page.tsx
"use client";

import { use, useState } from "react";
import { useTranslations } from "next-intl";
import { CustomerAuthGuard } from "@/components/auth/customer-auth-guard";
import { AccountTabs } from "@/components/account/account-tabs";
import { ProfileTab } from "@/components/account/profile-tab";
import { AddressesTab } from "@/components/account/addresses-tab";
import { OrderHistoryTab } from "@/components/account/order-history-tab";
import { TransactionsTab } from "@/components/account/transactions-tab";
import { FavoritesTab } from "@/components/account/favorites-tab";
import { Button, Icon } from "@/components/ui/primitives";
import { useCustomerAuthStore } from "@/store/customer-auth-store";

const TABS = [
  { key: "profile", icon: "user" },
  { key: "addresses", icon: "pin" },
  { key: "orders", icon: "bag" },
  { key: "transactions", icon: "ticket" },
  { key: "favorites", icon: "heart" },
];

export default function AccountPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const t = useTranslations("account");
  const th = useTranslations("header");
  const { tab } = use(searchParams);
  const [activeTab, setActiveTab] = useState(TABS.some((t) => t.key === tab) ? tab! : "profile");
  const customer = useCustomerAuthStore((s) => s.customer);
  const logout = useCustomerAuthStore((s) => s.logout);
  const active = TABS.find((t) => t.key === activeTab) ?? TABS[0];

  return (
    <CustomerAuthGuard>
      <div className="mx-auto max-w-[1200px] px-4 py-6 md:px-10 md:py-10">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-[32px] bg-saffron p-5 text-espresso md:p-7">
          <div className="flex min-w-0 items-center gap-4 md:gap-5">
            <div className="blob grid h-16 w-16 shrink-0 place-items-center bg-chili font-display text-3xl font-extrabold text-parchment shadow-hard md:h-20 md:w-20 md:text-4xl">
              {(customer?.name ?? "?").charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h1 className="font-display text-[32px] font-extrabold leading-none tracking-tight md:text-[48px]">
                {t("title")}
              </h1>
              <p className="mt-3 truncate font-medium">
                {customer?.name}
                {customer?.email ? ` · ${customer.email}` : ""}
              </p>
            </div>
          </div>
          <Button variant="ink" onClick={logout}><Icon name="logout" className="h-5 w-5" />{th("logOut")}</Button>
        </header>

        <div className="md:flex md:items-start md:gap-10">
          <AccountTabs tabs={TABS.map((x) => ({ ...x, label: t(`tabs.${x.key}.label`) }))} activeKey={activeTab} onSelect={setActiveTab} />

          <div key={activeTab} className="min-w-0 flex-1">
            <div className="animate-fade-up mb-6 mt-6 md:mt-0">
              <h2 className="font-display text-[32px] font-extrabold leading-tight md:text-[40px]">{t(`tabs.${active.key}.label`)}</h2>
              <p className="mt-1 text-lg text-ink/75">{t(`tabs.${active.key}.description`)}</p>
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
