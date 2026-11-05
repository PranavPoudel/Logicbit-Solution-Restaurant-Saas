// components/owner-email/order-picker.tsx
"use client";

import { Check, Receipt } from "lucide-react";
import type { EmailOrder } from "@/lib/api/owner-emails";
import { formatMoney } from "@/lib/utils/money";

const done = "bg-green-100 text-green-800";
const active = "bg-amber-100 text-amber-800";

export const orderStatus: Record<EmailOrder["status"], { label: string; className: string }> = {
  PENDING: { label: "Pending", className: active },
  ACCEPTED: { label: "Accepted", className: active },
  PREPARING: { label: "Preparing", className: active },
  READY: { label: "Ready", className: active },
  OUT_FOR_DELIVERY: { label: "On the way", className: active },
  DELIVERED: { label: "Delivered", className: done },
  COMPLETED: { label: "Completed", className: done },
  CANCELLED: { label: "Cancelled", className: "bg-red-100 text-red-800" },
};

export const formatOrderDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });

interface OrderPickerProps {
  orders: EmailOrder[];
  isLoading: boolean;
  orderId: string;
  onOrderChange: (id: string) => void;
}

const ring =
  "outline-none focus-visible:ring-2 focus-visible:ring-[#E3A008] focus-visible:ring-offset-2";

export function OrderPicker({ orders, isLoading, orderId, onOrderChange }: OrderPickerProps) {
  return (
    <fieldset className="min-w-0 space-y-3 border-t border-neutral-100 pt-6">
      <legend className="flex items-center gap-1.5 text-sm font-semibold text-neutral-900">
        <Receipt size={16} aria-hidden="true" className="text-[#E3A008]" />
        Related order
        <span className="ml-1 text-xs font-normal text-neutral-400">Optional</span>
      </legend>

      <ul role="radiogroup" aria-label="Related order" className="space-y-2">
        {isLoading &&
          [0, 1].map((i) => (
            <li key={i} className="h-16 animate-pulse rounded-xl bg-neutral-100 motion-reduce:animate-none" />
          ))}

        {!isLoading && orders.length === 0 && (
          <li className="rounded-xl border border-dashed border-neutral-200 px-4 py-5 text-center text-sm text-neutral-500">
            This customer has no orders with you yet.
          </li>
        )}

        {!isLoading &&
          orders.map((o) => {
            const selected = o.id === orderId;
            const status = orderStatus[o.status];
            return (
              <li key={o.id}>
                <button
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => onOrderChange(selected ? "" : o.id)}
                  className={`flex min-h-16 w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors motion-reduce:transition-none ${ring} ${
                    selected
                      ? "border-[#E3A008] bg-[#E3A008]/10"
                      : "border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50"
                  }`}
                >
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-neutral-900">Order {o.number}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${status.className}`}>
                        {status.label}
                      </span>
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-neutral-500">{o.items}</span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block text-sm font-medium tabular-nums text-neutral-900">
                      {formatMoney(o.total)}
                    </span>
                    <span className="block text-xs text-neutral-400">{formatOrderDate(o.placedAt)}</span>
                  </span>
                  {selected && <Check size={16} aria-hidden="true" className="shrink-0 text-[#E3A008]" />}
                </button>
              </li>
            );
          })}
      </ul>
      {orders.length > 0 && (
        <p className="text-xs text-neutral-500">
          The order number, items and total are added to the email. Select it again to remove it.
        </p>
      )}
    </fieldset>
  );
}
