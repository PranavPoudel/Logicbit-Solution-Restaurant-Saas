// components/account/transactions-tab.tsx
"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { listMyOrders } from "@/lib/api/orders";
import { AccountRow } from "@/components/account/account-row";
import { FilterChips } from "@/components/account/filter-chips";
import { Empty } from "@/components/account/empty";
import { money } from "@/lib/utils/money";

interface TransactionRow {
  id: string;
  orderNumber?: string;
  restaurant?: { name?: string };
  status?: string;
  total?: number;
  paymentMethod?: string;
  paymentStatus?: "UNPAID" | "PAID" | "REFUNDED";
  refund?: { amount?: number; status?: string } | null;
  createdAt?: string;
}

type FilterKey = "all" | "paid" | "refunded";

function getState(row: TransactionRow) {
  if (row.paymentStatus === "REFUNDED" || row.refund?.status === "PROCESSED") return { key: "refunded", tone: "ink" as const };
  if (row.paymentStatus === "PAID") return { key: "paid", tone: "herb" as const };
  if (row.status === "CANCELLED") return { key: "cancelled", tone: "soft" as const };
  return { key: "unpaid", tone: "saffron" as const };
}

const STATE_LABEL = { refunded: "stateRefunded", paid: "statePaid", cancelled: "stateCancelled", unpaid: "stateUnpaid" } as const;

export function TransactionsTab() {
  const t = useTranslations("account");
  const locale = useLocale();
  const filters = [
    { key: "all", label: t("filterAll") },
    { key: "paid", label: t("filterPaid") },
    { key: "refunded", label: t("filterRefunded") },
  ] as const;
  const [filter, setFilter] = useState<FilterKey>("all");
  const { data, isLoading } = useQuery({
    queryKey: ["my-orders"],
    queryFn: () => listMyOrders() as Promise<TransactionRow[]>,
  });

  const rows = (data ?? []).map((row) => ({ row, state: getState(row) }));
  const totalPaid = rows.filter((r) => r.state.key === "paid").reduce((sum, r) => sum + (r.row.total ?? 0), 0);
  const totalRefunded = rows
    .filter((r) => r.state.key === "refunded")
    .reduce((sum, r) => sum + (r.row.refund?.amount ?? r.row.total ?? 0), 0);
  const visible = filter === "all" ? rows : rows.filter((r) => r.state.key === filter);

  return (
    <div className="max-w-3xl space-y-4 pb-5">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-[24px] bg-herb p-4 text-parchment shadow-soft md:p-5">
          <p className="font-bold opacity-90">{t("totalPaid")}</p>
          <p className="mt-1 font-display text-3xl font-extrabold">{money(totalPaid)}</p>
        </div>
        <div className="rounded-[24px] bg-saffron p-4 text-espresso shadow-soft md:p-5">
          <p className="font-bold">{t("totalRefunded")}</p>
          <p className="mt-1 font-display text-3xl font-extrabold">{money(totalRefunded)}</p>
        </div>
      </div>

      <FilterChips filters={filters} active={filter} onChange={setFilter} />

      <div key={filter} className="space-y-3">
        {isLoading ? (
          <p className="text-lg text-ink/70">{t("loadingTransactions")}</p>
        ) : visible.length === 0 ? (
          <Empty>{t("noTransactions")}</Empty>
        ) : (
          visible.map(({ row, state }, i) => (
            <AccountRow
              key={row.id}
              href={`/orders/${row.id}`}
              title={row.restaurant?.name ?? t("orderFallback")}
              subtitle={`${t.has(`methods.${row.paymentMethod}`) ? t(`methods.${row.paymentMethod}`) : row.paymentMethod ?? "—"}${row.createdAt ? ` · ${new Date(row.createdAt).toLocaleDateString(locale)}` : ""}`}
              amount={row.total ?? 0}
              badge={{ label: t(STATE_LABEL[state.key as keyof typeof STATE_LABEL]), tone: state.tone }}
              index={i}
            />
          ))
        )}
      </div>
    </div>
  );
}
