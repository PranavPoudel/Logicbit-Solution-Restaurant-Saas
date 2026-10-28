// components/owner-subscription/payment-history.tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import { Receipt } from "lucide-react";
import { subscriptionPaymentsApi, type SubscriptionPayment } from "@/lib/api/subscription-payments";
import { formatMoney } from "@/lib/utils/money";

const status: Record<SubscriptionPayment["status"], { label: string; className: string }> = {
  PAID: { label: "Paid", className: "bg-green-100 text-green-800" },
  PENDING: { label: "Pending", className: "bg-amber-100 text-amber-800" },
  FAILED: { label: "Failed", className: "bg-red-100 text-red-800" },
};

const methodLabel = { PAYPAY: "PayPay", CARD: "Card" } as const;

export function PaymentHistory({ restaurantId }: { restaurantId: string }) {
  const { data = [], isLoading } = useQuery({
    queryKey: ["subscription-payments", restaurantId],
    queryFn: () => subscriptionPaymentsApi.history(restaurantId),
  });

  return (
    <section aria-label="Payment history" className="rounded-xl border border-neutral-200 bg-white p-6">
      <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-neutral-900">
        <Receipt size={16} aria-hidden="true" className="text-neutral-400" />
        Payment history
      </h2>
      {isLoading ? (
        <div className="h-12 animate-pulse rounded-lg bg-neutral-100 motion-reduce:animate-none" />
      ) : data.length === 0 ? (
        <p className="text-sm text-neutral-500">No payments yet. Your subscription payments will be listed here.</p>
      ) : (
        <ul className="divide-y divide-neutral-100">
          {data.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
              <div className="min-w-0">
                <p className="text-sm font-medium text-neutral-900">{methodLabel[p.method]}</p>
                <p className="text-xs text-neutral-500">
                  {new Date(p.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="text-sm font-medium tabular-nums text-neutral-900">{formatMoney(p.amount, p.currencyCode)}</span>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${status[p.status].className}`}>{status[p.status].label}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
