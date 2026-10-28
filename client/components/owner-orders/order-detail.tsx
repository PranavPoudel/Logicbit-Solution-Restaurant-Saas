// components/owner-orders/order-detail.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowRight, Bike, Check, ChevronRight, Clock, Loader2, MapPin, Package, Phone, UtensilsCrossed, Wallet, type LucideIcon } from "lucide-react";
import type { OwnerOrderSummary } from "@/types/owner-order";
import { formatMoney } from "@/lib/utils/money";
import { ageLabel, flowFor, minutesSince, nextStep, shortNumber, stepIndex } from "@/lib/utils/order-flow";

export const DETAIL_TITLE_ID = "order-detail-title";
export const PRIMARY_ACTION_ID = "order-primary-action";

const HANDLED_BY: Record<string, string> = {
  SELF_DELIVERY: "Your own riders",
  THIRD_PARTY: "Delivery partner",
};

const PAYMENT_METHOD: Record<string, string> = {
  COD: "Cash on delivery",
  CARD: "Card",
  ONLINE: "Online",
};

const TYPE_ICON: Record<string, LucideIcon> = { DELIVERY: MapPin, PICKUP: Package, DINE_IN: UtensilsCrossed };

const humanize = (value?: string) => (value ? value.charAt(0) + value.slice(1).toLowerCase().replace(/_/g, " ") : "");

const initials = (name?: string) =>
  (name ?? "?")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

const button = "inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none outline-none focus-visible:ring-2 focus-visible:ring-[#E3A008] focus-visible:ring-offset-2";

function Stepper({ order }: { order: OwnerOrderSummary }) {
  const flow = flowFor(order.orderType);
  const current = stepIndex((order.status ?? "PENDING").toUpperCase(), order.orderType);
  const finished = current === flow.length - 1;

  return (
    <ol aria-label="Order progress" className="grid auto-cols-fr grid-flow-col rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-4">
      {flow.map((step, i) => {
        const done = i < current || (finished && i === current);
        const active = i === current && !finished;
        return (
          <li key={step.status} aria-current={active ? "step" : undefined} className="relative flex flex-col items-center gap-2 text-center">
            {i > 0 && <span aria-hidden="true" className={`absolute right-1/2 top-3 h-[3px] w-full rounded-full ${i <= current ? "bg-emerald-500" : "bg-neutral-200"}`} />}
            <span
              aria-hidden="true"
              className={`relative flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors duration-200 motion-reduce:transition-none ${
                done ? "bg-emerald-500 text-white" : active ? "bg-[#E3A008] text-[#111827] ring-4 ring-amber-200/70" : "border-2 border-neutral-300 bg-white text-neutral-500"
              }`}
            >
              {done ? <Check size={14} strokeWidth={3} /> : i + 1}
            </span>
            <span className={`text-xs leading-tight ${active ? "font-semibold text-neutral-900" : done ? "font-medium text-neutral-700" : "text-neutral-500"}`}>
              {step.label}
              <span className="sr-only">{done ? ", done" : active ? ", current step" : ", upcoming"}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

interface OrderDetailProps {
  order: OwnerOrderSummary;
  now: number;
  disabled: boolean;
  pending: boolean;
  onAdvance: (next: string) => void;
  onCancel: () => void;
}

export function OrderDetail({ order, now, disabled, pending, onAdvance, onCancel }: OrderDetailProps) {
  const [confirming, setConfirming] = useState(false);
  const status = (order.status ?? "PENDING").toUpperCase();
  const isNew = status === "PENDING";
  const cancelled = status === "CANCELLED";
  const finished = status === "DELIVERED" || status === "COMPLETED";
  const step = nextStep(status, order.orderType);
  const items = order.items ?? [];
  const placed = order.createdAt ? new Date(order.createdAt) : null;
  const rider = order.delivery?.deliveryPerson;
  const delivery = order.deliveryFee ?? 0;
  const discount = order.discountAmount ?? 0;
  const quantity = items.reduce((sum, i) => sum + (i.quantity ?? 1), 0);

  const facts: { label: string; value: string; icon: LucideIcon; wide?: boolean }[] = [
    { label: "Order type", value: humanize(order.orderType), icon: TYPE_ICON[order.orderType ?? "PICKUP"] ?? Package },
    { label: "Payment", value: [order.paymentMethod ? (PAYMENT_METHOD[order.paymentMethod] ?? humanize(order.paymentMethod)) : "", humanize(order.paymentStatus)].filter(Boolean).join(" · "), icon: Wallet },
    ...(order.orderType === "DELIVERY" && order.deliveryAddress ? [{ label: "Deliver to", value: order.deliveryAddress, icon: MapPin, wide: true }] : []),
    ...(rider?.name
      ? [{ label: "Rider", value: [rider.name, rider.phone].filter(Boolean).join(" · "), icon: Bike }]
      : order.deliveryHandledBy
        ? [{ label: "Delivery by", value: HANDLED_BY[order.deliveryHandledBy] ?? humanize(order.deliveryHandledBy), icon: Bike }]
        : []),
    { label: "Placed", value: placed ? placed.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "-", icon: Clock },
  ];

  const oddTiles = facts.filter((f) => !f.wide).length % 2 === 1;

  return (
    <article aria-labelledby={DETAIL_TITLE_ID} data-order-id={order.id} className="flex flex-1 flex-col">
      <div className="flex-1 space-y-6 p-5 sm:p-7">
        <header className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
          <div className="flex min-w-0 items-center gap-3.5">
            <span aria-hidden="true" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#111827] text-sm font-semibold text-white">
              {initials(order.customer?.name)}
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
                <h2 id={DETAIL_TITLE_ID} tabIndex={-1} title={order.orderNumber} className="font-mono text-2xl font-semibold tracking-tight text-neutral-900 outline-none">
                  #{shortNumber(order)}
                </h2>
                <Link
                  href={`/owner/orders/${order.id}`}
                  className="inline-flex min-h-8 items-center gap-0.5 rounded-full border border-neutral-200 px-2.5 text-xs font-medium text-neutral-600 outline-none transition-colors hover:border-neutral-300 hover:bg-neutral-50 hover:text-neutral-900 focus-visible:ring-2 focus-visible:ring-[#E3A008] motion-reduce:transition-none"
                >
                  Full details
                  <ChevronRight size={14} aria-hidden="true" />
                </Link>
              </div>
              <p className="mt-0.5 flex flex-wrap items-center gap-x-2.5 text-sm text-neutral-700">
                <span className="font-medium">{order.customer?.name ?? "Customer"}</span>
                {order.customer?.phone && (
                  <a href={`tel:${order.customer.phone}`} className="inline-flex min-h-6 items-center gap-1 rounded text-neutral-500 outline-none hover:text-neutral-900 focus-visible:ring-2 focus-visible:ring-[#E3A008]">
                    <Phone size={12} aria-hidden="true" />
                    {order.customer.phone}
                  </a>
                )}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-neutral-500">Total</p>
            <p className="text-3xl font-semibold tabular-nums tracking-tight text-neutral-900">{formatMoney(order.total ?? 0)}</p>
            {!cancelled && !finished && <p className="text-xs text-neutral-500">Placed {ageLabel(minutesSince(order.createdAt, now))} ago</p>}
          </div>
        </header>

        {cancelled ? (
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
            <AlertCircle size={18} aria-hidden="true" className="mt-0.5 shrink-0 text-red-600" />
            <p>This order was cancelled{order.cancellationReason ? `: ${order.cancellationReason}` : "."}</p>
          </div>
        ) : (
          <Stepper order={order} />
        )}

        <section aria-labelledby="detail-items">
          <h3 id="detail-items" className="mb-3 flex items-baseline gap-2 text-sm font-semibold text-neutral-900">
            Items
            <span className="text-xs font-medium text-neutral-500">
              {quantity} {quantity === 1 ? "item" : "items"}
            </span>
          </h3>
          <ul className="divide-y divide-neutral-100">
            {items.map((item, i) => (
              <li key={item.menuItemId ?? i} className="flex items-start gap-3 py-3 first:pt-0">
                <span className="inline-flex h-7 min-w-8 items-center justify-center rounded-lg bg-neutral-100 px-1.5 text-xs font-semibold tabular-nums text-neutral-700">{item.quantity ?? 1}×</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-medium text-neutral-900">{item.menuItem?.name ?? "Item"}</span>
                  {!!item.selectedModifiers?.length && (
                    <span className="mt-1 flex flex-wrap gap-1">
                      {item.selectedModifiers.map((m, j) => (
                        <span key={j} className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[11px] font-medium text-amber-900 ring-1 ring-amber-200">
                          {m.name}
                        </span>
                      ))}
                    </span>
                  )}
                </span>
                <span className="text-sm font-medium tabular-nums text-neutral-700">{formatMoney(item.subtotal ?? (item.unitPrice ?? 0) * (item.quantity ?? 1))}</span>
              </li>
            ))}
            {items.length === 0 && <li className="py-3 text-sm text-neutral-500">No items on this order.</li>}
          </ul>

          <dl className="mt-4 space-y-1.5 rounded-xl bg-neutral-50 p-4 text-sm sm:ml-auto sm:max-w-xs">
            <div className="flex justify-between gap-4 text-neutral-600">
              <dt>Subtotal</dt>
              <dd className="tabular-nums">{formatMoney(order.subtotal ?? 0)}</dd>
            </div>
            {delivery > 0 && (
              <div className="flex justify-between gap-4 text-neutral-600">
                <dt>Delivery fee</dt>
                <dd className="tabular-nums">{formatMoney(delivery)}</dd>
              </div>
            )}
            {discount > 0 && (
              <div className="flex justify-between gap-4 text-emerald-700">
                <dt>Discount{order.couponCode ? ` (${order.couponCode})` : ""}</dt>
                <dd className="tabular-nums">-{formatMoney(discount)}</dd>
              </div>
            )}
            <div className="flex items-baseline justify-between gap-4 border-t border-neutral-200 pt-2 text-neutral-900">
              <dt className="font-semibold">Total</dt>
              <dd className="text-lg font-semibold tabular-nums">{formatMoney(order.total ?? 0)}</dd>
            </div>
          </dl>
        </section>

        <div className="@container">
          <dl className="grid grid-cols-1 gap-3 @md:grid-cols-2">
            {facts.map(({ label, value, icon: Icon, wide }, i) => (
              <div key={label} className={`flex items-center gap-3 rounded-xl border border-neutral-200 p-3 ${wide || (i === facts.length - 1 && oddTiles) ? "@md:col-span-2" : ""}`}>
                <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-neutral-600">
                  <Icon size={16} />
                </span>
                <div className="min-w-0">
                  <dt className="text-xs text-neutral-500">{label}</dt>
                  <dd className="break-words text-sm font-medium text-neutral-900">{value}</dd>
                </div>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {step && (
        <div className="sticky bottom-0 z-10 border-t border-neutral-200 bg-white p-4 shadow-[0_-12px_20px_-16px_rgba(17,24,39,0.35)] sm:px-7">
          {confirming ? (
            <div role="group" aria-label="Confirm cancellation" className="flex flex-wrap items-center gap-3">
              <p className="min-w-[14rem] flex-1 text-sm text-neutral-700">{isNew ? "Reject this order? The customer is told it was cancelled." : "Cancel this order? The customer is told it was cancelled."}</p>
              <button type="button" onClick={() => setConfirming(false)} className={`${button} border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50`}>
                Keep order
              </button>
              <button
                type="button"
                disabled={disabled}
                onClick={() => {
                  setConfirming(false);
                  onCancel();
                }}
                className={`${button} bg-red-600 text-white hover:bg-red-700`}
              >
                {isNew ? "Yes, reject" : "Yes, cancel"}
              </button>
            </div>
          ) : (
            <div className="flex gap-3">
              <button type="button" disabled={disabled} onClick={() => setConfirming(true)} className={`${button} border border-neutral-300 bg-white text-neutral-700 hover:border-red-200 hover:bg-red-50 hover:text-red-700`}>
                {isNew ? "Reject" : "Cancel order"}
              </button>
              <button
                id={PRIMARY_ACTION_ID}
                type="button"
                disabled={disabled}
                onClick={() => onAdvance(step.next)}
                className={`group ${button} flex-1 active:scale-[0.99] motion-reduce:active:scale-100 ${isNew ? "bg-[#E3A008] text-[#111827] hover:bg-[#d49207]" : "bg-[#111827] text-white hover:bg-[#1f2937]"}`}
              >
                {pending ? <Loader2 size={16} aria-hidden="true" className="animate-spin motion-reduce:animate-none" /> : null}
                {step.label}
                {!pending && <ArrowRight size={16} aria-hidden="true" className="transition-transform duration-150 group-hover:translate-x-0.5 motion-reduce:transition-none" />}
              </button>
            </div>
          )}
        </div>
      )}
    </article>
  );
}
