// components/account/transactions-tab.tsx
"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { listMyOrders } from "@/lib/api/orders";
import { AccountRow } from "@/components/account/account-row";
import { FilterChips } from "@/components/account/filter-chips";

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

const METHOD_LABELS: Record<string, string> = {
  COD: "Cash on delivery",
  CREDIT_CARD: "Card",
  ESEWA: "eSewa",
  KHALTI: "Khalti",
  IPS: "ConnectIPS",
  PHONEPAY: "PhonePe",
  PAYPAY: "PayPay",
};

const FILTERS = [
  { key: "all", label: "All" },
  { key: "paid", label: "Paid" },
  { key: "refunded", label: "Refunded" },
] as const;

type FilterKey = (typeof FILTERS)[number]["key"];

function getState(row: TransactionRow) {
  if (row.paymentStatus === "REFUNDED" || row.refund?.status === "PROCESSED") {
    return { key: "refunded", label: "Refunded", style: "bg-blue-50 text-blue-700" };
  }
  if (row.paymentStatus === "PAID") return { key: "paid", label: "Paid", style: "bg-emerald-50 text-emerald-700" };
  if (row.status === "CANCELLED") return { key: "cancelled", label: "Cancelled", style: "bg-neutral-100 text-neutral-500" };
  return { key: "unpaid", label: "Unpaid", style: "bg-amber-50 text-amber-700" };
}

export function TransactionsTab() {
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
    <div className="max-w-3xl pb-5 space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-[#E8E7E2] bg-white p-4 md:p-5">
          <p className="text-xs text-neutral-400">Total paid</p>
          <p className="mt-1 font-mono text-xl font-semibold text-[#17181C]">Rs {totalPaid}</p>
        </div>
        <div className="rounded-xl border border-[#E8E7E2] bg-white p-4 md:p-5">
          <p className="text-xs text-neutral-400">Total refunded</p>
          <p className="mt-1 font-mono text-lg font-semibold text-[#17181C]">Rs {totalRefunded}</p>
        </div>
      </div>

      <FilterChips filters={FILTERS} active={filter} onChange={setFilter} />

      <div key={filter} className="space-y-2.5">
        {isLoading ? (
          <p className="text-sm text-neutral-400">Loading transactions…</p>
        ) : visible.length === 0 ? (
          <p className="text-sm text-neutral-400">No transactions yet.</p>
        ) : (
          visible.map(({ row, state }, i) => (
            <AccountRow
              key={row.id}
              href={`/orders/${row.id}`}
              title={row.restaurant?.name ?? "Order"}
              subtitle={`${METHOD_LABELS[row.paymentMethod ?? ""] ?? row.paymentMethod ?? "—"}${row.createdAt ? ` · ${new Date(row.createdAt).toLocaleDateString()}` : ""}`}
              amount={row.total ?? 0}
              badge={{ label: state.label, style: state.style }}
              index={i}
            />
          ))
        )}
      </div>
    </div>
  );
}
