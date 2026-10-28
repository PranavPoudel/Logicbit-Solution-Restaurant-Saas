// components/owner-orders/order-card.tsx
"use client";

import { Clock } from "lucide-react";
import type { OwnerOrderSummary } from "@/types/order";  

const NEXT_STATUS: Record<string, { label: string; next: string } | undefined> = {
  ACCEPTED: { label: "Start preparing", next: "PREPARING" },
  PREPARING: { label: "Mark ready", next: "READY" },
  READY: { label: "Send out for delivery", next: "OUT_FOR_DELIVERY" },
  OUT_FOR_DELIVERY: { label: "Mark delivered", next: "DELIVERED" },
};

export function OrderCard({
  order,
  onAccept,
  onReject,
  onAdvance,
  onView,
  isMutating,
}: {
  order: OwnerOrderSummary;
  onAccept: () => void;
  onReject: () => void;
  onAdvance: (nextStatus: string) => void;
  onView: () => void;
  isMutating: boolean;
}) {
  const status = (order.status ?? "PENDING").toUpperCase();
  const isNew = status === "PENDING";
  const nextAction = NEXT_STATUS[status];

  return (
    <div
      onClick={onView}
      className="bg-white border border-neutral-200 rounded-xl p-4 cursor-pointer hover:border-[#E3A008] transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-neutral-900">
            #{order.orderNumber ?? order.id.slice(0, 8)}
            {order.customer?.name ? ` — ${order.customer.name}` : ""}
          </p>
          <div className="mt-1 space-y-0.5">
            {(order.items ?? []).map((item, i) => (
              <p key={i} className="text-xs text-neutral-500">
                {item.quantity ?? 1}× {item.menuItem?.name ?? `Item (Rs ${item.unitPrice ?? "?"})`}
              </p>
            ))}
          </div>
        </div>
        <span className="text-sm font-mono font-semibold text-neutral-800 shrink-0">
          Rs {order.total ?? 0}
        </span>
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-neutral-100">
        <span className="flex items-center gap-1 text-[11px] text-neutral-400">
          <Clock size={11} />
          {order.createdAt ? new Date(order.createdAt).toLocaleTimeString() : "—"}
        </span>

        {isNew ? (
          <div className="flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onReject();
              }}
              disabled={isMutating}
              className="text-xs font-medium text-red-600 border border-red-200 px-3 py-1.5 rounded-md disabled:opacity-50"
            >
              Reject
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAccept();
              }}
              disabled={isMutating}
              className="text-xs font-medium bg-[#1B2333] text-white px-3 py-1.5 rounded-md disabled:opacity-50"
            >
              Accept
            </button>
          </div>
        ) : nextAction ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAdvance(nextAction.next);
            }}
            disabled={isMutating}
            className="text-xs font-medium bg-[#1B2333] text-white px-3 py-1.5 rounded-md disabled:opacity-50"
          >
            {nextAction.label}
          </button>
        ) : (
          <span className="text-xs text-neutral-400 flex items-center gap-1">
            <span>
              {status === "DELIVERED" ? "Completed" : status === "CANCELLED" ? "Cancelled" : status}
            </span>
            <span className="text-[#E3A008]">· View details</span>
          </span>
        )}
      </div>
    </div>
  );
}