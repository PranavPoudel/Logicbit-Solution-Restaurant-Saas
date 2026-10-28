// components/owner-orders/order-list.tsx
"use client";

import { useRef } from "react";
import { Clock, MapPin, Package, UtensilsCrossed, type LucideIcon } from "lucide-react";
import type { OwnerOrderSummary } from "@/types/order";
import { formatMoney } from "@/lib/utils/money";
import { ageLabel, minutesSince, shortNumber, stageLabel, urgency } from "@/lib/utils/order-flow";

export interface OrderGroup {
  key: string;
  label: string;
  orders: OwnerOrderSummary[];
}

const TYPE_ICON: Record<string, { label: string; icon: LucideIcon }> = {
  DELIVERY: { label: "Delivery", icon: MapPin },
  PICKUP: { label: "Pickup", icon: Package },
  DINE_IN: { label: "Dine in", icon: UtensilsCrossed },
};

const STATUS_STYLE: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-900",
  ACCEPTED: "bg-blue-100 text-blue-900",
  PREPARING: "bg-purple-100 text-purple-900",
  READY: "bg-teal-100 text-teal-900",
  OUT_FOR_DELIVERY: "bg-emerald-100 text-emerald-900",
  DELIVERED: "bg-neutral-100 text-neutral-700",
  COMPLETED: "bg-neutral-100 text-neutral-700",
  CANCELLED: "bg-red-100 text-red-800",
};

const GROUP_DOT: Record<string, string> = {
  PENDING: "bg-[#E3A008]",
  ACCEPTED: "bg-blue-500",
  PREPARING: "bg-purple-500",
  OUT_FOR_DELIVERY: "bg-emerald-500",
  DELIVERED: "bg-neutral-400",
  CANCELLED: "bg-red-500",
};

const AGE_PILL: Record<"late" | "warn" | "ok", string> = {
  late: "bg-red-100 text-red-800",
  warn: "bg-amber-100 text-amber-900",
  ok: "bg-neutral-100 text-neutral-600",
};

const EDGE: Record<"late" | "warn" | "ok", string> = {
  late: "shadow-[inset_3px_0_0_#DC2626]",
  warn: "shadow-[inset_3px_0_0_#F59E0B]",
  ok: "",
};

interface OrderListProps {
  groups: OrderGroup[];
  selectedId?: string;
  now: number;
  closed: boolean;
  onSelect: (id: string) => void;
}

export function OrderList({ groups, selectedId, now, closed, onSelect }: OrderListProps) {
  const root = useRef<HTMLElement>(null);

  const move = (e: React.KeyboardEvent, delta: number) => {
    const buttons = [...(root.current?.querySelectorAll<HTMLButtonElement>("button[data-order]") ?? [])];
    const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
    const next = buttons[index + delta];
    if (!next) return;
    e.preventDefault();
    next.focus();
  };

  return (
    <nav
      ref={root}
      aria-label="Orders"
      onKeyDown={(e) => {
        if (e.key === "ArrowDown") move(e, 1);
        else if (e.key === "ArrowUp") move(e, -1);
      }}
    >
      {groups.map((group) => (
        <section key={group.key} aria-labelledby={`group-${group.key}`}>
          <h3 id={`group-${group.key}`} className="flex items-center gap-2 border-y border-neutral-200 bg-neutral-100/70 px-4 py-2 text-[11px] font-semibold tracking-wide text-neutral-600 first:border-t-0">
            <span aria-hidden="true" className={`h-2 w-2 rounded-full ${GROUP_DOT[group.key] ?? "bg-neutral-400"}`} />
            {group.label}
            <span className="ml-auto rounded-full bg-white px-1.5 text-[11px] font-semibold tabular-nums text-neutral-600 ring-1 ring-neutral-200">{group.orders.length}</span>
          </h3>
          <ul>
            {group.orders.map((order) => {
              const status = (order.status ?? "PENDING").toUpperCase();
              const minutes = minutesSince(order.createdAt, now);
              const level = closed ? "ok" : urgency(status, minutes);
              const type = TYPE_ICON[order.orderType ?? "PICKUP"] ?? TYPE_ICON.PICKUP;
              const TypeIcon = type.icon;
              const selected = order.id === selectedId;
              const count = (order.items ?? []).reduce((sum, i) => sum + (i.quantity ?? 1), 0);

              return (
                <li key={order.id} className="border-b border-neutral-200 last:border-b-0">
                  <button
                    type="button"
                    data-order
                    aria-current={selected ? "true" : undefined}
                    onClick={() => onSelect(order.id)}
                    className={`grid w-full min-h-[4.75rem] grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5 px-4 py-3 text-left outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#E3A008] motion-reduce:transition-none ${
                      selected ? "bg-amber-50 shadow-[inset_3px_0_0_#E3A008]" : `bg-white hover:bg-neutral-50 ${EDGE[level]}`
                    }`}
                  >
                    <span className="flex min-w-0 items-baseline gap-2">
                      <span className="font-mono text-[15px] font-semibold tracking-tight text-neutral-900">#{shortNumber(order)}</span>
                      <span className="truncate text-sm font-medium text-neutral-700">{order.customer?.name ?? "Customer"}</span>
                    </span>
                    {closed ? (
                      <span className="text-xs text-neutral-500">
                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : ""}
                      </span>
                    ) : (
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium tabular-nums ${AGE_PILL[level]}`}>
                        <Clock size={12} aria-hidden="true" />
                        {level !== "ok" && "Waiting "}
                        {ageLabel(minutes)}
                      </span>
                    )}
                    <span className="flex min-w-0 items-center gap-1.5 text-xs text-neutral-500">
                      <TypeIcon size={13} aria-hidden="true" className="shrink-0" />
                      <span className="truncate">
                        {type.label} · {count} {count === 1 ? "item" : "items"}
                      </span>
                    </span>
                    <span className="flex items-center justify-end gap-2">
                      {status !== group.key && (
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLE[status] ?? STATUS_STYLE.DELIVERED}`}>
                          <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />
                          {stageLabel(status, order.orderType)}
                        </span>
                      )}
                      <span className="text-sm font-semibold tabular-nums text-neutral-900">{formatMoney(order.total ?? 0)}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </nav>
  );
}
