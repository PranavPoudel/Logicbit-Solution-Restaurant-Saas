// components/owner-email/recent-orders.tsx
import { Receipt } from "lucide-react";
import type { EmailOrder } from "@/lib/api/owner-emails";
import { formatMoney } from "@/lib/utils/money";
import { formatOrderDate, orderStatus } from "./order-picker";

interface RecentOrdersProps {
  orders: EmailOrder[];
  isLoading: boolean;
  activeOrderId: string;
  onPick: (order: EmailOrder) => void;
}

export function RecentOrders({ orders, isLoading, activeOrderId, onPick }: RecentOrdersProps) {
  return (
    <section aria-label="Recent orders" className="rounded-xl border border-neutral-200 bg-white p-5">
      <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold text-neutral-900">
        <Receipt size={16} aria-hidden="true" className="text-neutral-400" />
        Recent orders
      </h2>
      <p className="mb-3 text-xs text-neutral-500">Pick an order to email the customer about it.</p>

      {isLoading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg bg-neutral-100 motion-reduce:animate-none" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <p className="text-sm text-neutral-500">No orders yet. They show up here as customers order.</p>
      ) : (
        <ul className="space-y-1">
          {orders.map((o) => {
            const active = o.id === activeOrderId;
            const status = orderStatus[o.status];
            return (
              <li key={o.id}>
                <button
                  type="button"
                  aria-pressed={active}
                  onClick={() => onPick(o)}
                  className={`flex min-h-14 w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors motion-reduce:transition-none outline-none focus-visible:ring-2 focus-visible:ring-[#E3A008] focus-visible:ring-offset-2 ${
                    active ? "bg-[#E3A008]/10" : "hover:bg-neutral-50"
                  }`}
                >
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium text-neutral-900">{o.customerName}</span>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${status.className}`}>
                        {status.label}
                      </span>
                    </span>
                    <span className="block truncate text-xs text-neutral-500">
                      {o.number} · {formatOrderDate(o.placedAt)}
                    </span>
                  </span>
                  <span className="shrink-0 text-sm font-medium tabular-nums text-neutral-900">
                    {formatMoney(o.total)}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
