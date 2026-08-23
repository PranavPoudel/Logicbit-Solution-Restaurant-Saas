// components/dashboard/pending-orders-widget.tsx
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

interface PendingOrder {
  id: string;
  code: string;
  customerName: string;
  itemCount: number;
  total: number;
  placedMinutesAgo: number;
}

export function PendingOrdersWidget({ orders }: { orders: PendingOrder[] }) {
  return (
    <div className="bg-white border border-neutral-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-neutral-800">
          Needs your action
        </h3>
        <Link
          href="/orders"
          className="text-xs text-neutral-500 hover:text-neutral-800 flex items-center gap-1"
        >
          View all <ArrowUpRight size={12} />
        </Link>
      </div>

      {orders.length === 0 ? (
        <p className="text-sm text-neutral-400 py-6 text-center">
          No pending orders right now.
        </p>
      ) : (
        <ul className="divide-y divide-neutral-100">
          {orders.map((order) => (
            <li key={order.id} className="py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-800">
                  #{order.code} — {order.customerName}
                </p>
                <p className="text-xs text-neutral-400">
                  {order.itemCount} items · Rs {order.total} · {order.placedMinutesAgo}m ago
                </p>
              </div>
              <Link
                href={`/orders?id=${order.id}`}
                className="text-xs font-medium bg-[#1B2333] text-white px-3 py-1.5 rounded-md hover:bg-[#1B2333]/90"
              >
                Review
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
