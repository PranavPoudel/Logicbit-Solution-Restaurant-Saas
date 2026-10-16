// components/account/order-history-tab.tsx
"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { listMyOrders } from "@/lib/api/orders";
import { AccountRow } from "@/components/account/account-row";
import { FilterChips } from "@/components/account/filter-chips";
import { Pager } from "@/components/ui/pager";
import { Empty } from "@/components/account/empty";

interface OrderRow {
  id: string;
  orderNumber?: string;
  restaurant?: { name?: string };
  status?: string;
  total?: number;
  createdAt?: string;
}

const PAGE_SIZE = 10;

type Category = "all" | "active" | "completed" | "cancelled";

function getCategory(status?: string): Exclude<Category, "all"> {
  if (status === "DELIVERED" || status === "COMPLETED") return "completed";
  if (status === "CANCELLED") return "cancelled";
  return "active";
}

const TONES = { active: "saffron", completed: "herb", cancelled: "soft" } as const;

export function OrderHistoryTab() {
  const t = useTranslations("account");
  const to = useTranslations("order");
  const locale = useLocale();
  const statusLabel = (status?: string) =>
    status ? (to.has(`status.${status}`) ? to(`status.${status}`) : status.charAt(0) + status.slice(1).toLowerCase().replace(/_/g, " ")) : "—";
  const [category, setCategory] = useState<Category>("all");
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ["my-orders"],
    queryFn: () => listMyOrders() as Promise<OrderRow[]>,
  });

  const orders = data ?? [];
  const count = (c: Category) => (c === "all" ? orders.length : orders.filter((o) => getCategory(o.status) === c).length);
  const filters = [
    { key: "all", label: t("filterAll"), count: count("all") },
    { key: "active", label: t("filterActive"), count: count("active") },
    { key: "completed", label: t("filterCompleted"), count: count("completed") },
    { key: "cancelled", label: t("filterCancelled"), count: count("cancelled") },
  ] as const;
  const filtered = category === "all" ? orders : orders.filter((o) => getCategory(o.status) === category);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="max-w-3xl space-y-4 pb-5">
      <FilterChips filters={filters} active={category} onChange={(c) => { setCategory(c); setPage(1); }} />

      {isLoading ? (
        <p className="text-lg text-ink/70">{t("loadingOrders")}</p>
      ) : visible.length === 0 ? (
        <Empty>{orders.length === 0 ? t("noOrders") : t("noOrdersCategory")}</Empty>
      ) : (
        <div key={`${category}-${page}`} className="space-y-3">
          {visible.map((order, i) => (
            <AccountRow
              key={order.id}
              href={`/orders/${order.id}`}
              title={order.restaurant?.name ?? t("orderFallback")}
              subtitle={[order.orderNumber && `#${order.orderNumber}`, order.createdAt && new Date(order.createdAt).toLocaleDateString(locale)]
                .filter(Boolean)
                .join(" · ")}
              amount={order.total ?? 0}
              badge={{ label: statusLabel(order.status), tone: TONES[getCategory(order.status)] }}
              index={i}
            />
          ))}
        </div>
      )}

      <Pager page={page} pageCount={pageCount} onChange={setPage} />
    </div>
  );
}
