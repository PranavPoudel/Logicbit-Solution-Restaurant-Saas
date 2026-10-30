// components/dashboard/pending-orders-widget.tsx
"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useMoney } from "@/hooks/use-money";

interface PendingOrder {
  id: string;
  code: string;
  customerName: string;
  itemCount: number;
  total: number;
  placedMinutesAgo: number;
}

export function PendingOrdersWidget({ orders }: { orders: PendingOrder[] }) {
  const money = useMoney();
  return (
    <div className="bg-white border border-neutral-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-neutral-800">
          Needs your action
        </h3>
        {/* ✅ FIX: Point "View all" to the owner orders page */}
        <Link
          href="/owner/orders"
          className="flex min-h-11 items-center gap-1 text-xs text-neutral-500 hover:text-neutral-800"
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
                  {order.itemCount} items · {money(order.total)} · {order.placedMinutesAgo}m ago
                </p>
              </div>
              {/* ✅ FIX: Point "Review" to the specific owner order page */}
              <Link
                href={`/owner/orders/${order.id}`}
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