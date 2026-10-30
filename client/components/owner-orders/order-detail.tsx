// components/owner-orders/order-detail.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowRight, Bike, Check, ChevronRight, Clock, Loader2, MapPin, Package, Phone, RotateCcw, UtensilsCrossed, Wallet, X, type LucideIcon } from "lucide-react";
import type { OwnerOrderSummary } from "@/types/order";
import { formatMoney } from "@/lib/utils/money";
import { ageLabel, flowFor, minutesSince, nextStep, shortNumber, stepIndex } from "@/lib/utils/order-flow";
import { riderOf } from "@/lib/utils/order-rider";

export const DETAIL_TITLE_ID = "order-detail-title";
export const PRIMARY_ACTION_ID = "order-primary-action";
const RIDER_TRIGGER_ID = "rider-details-trigger";

const HANDLED_BY: Record<string, string> = {
  SELF_DELIVERY: "Your own riders",
  THIRD_PARTY: "Delivery partner",
};

const PAYMENT_METHOD: Record<string, string> = {
  COD: "Cash on delivery",
  CARD: "Card",
  ONLINE: "Online",
};

const REFUND_STATE: Record<string, { label: string; note: string; tone: string }> = {
  PENDING: { label: "Refund pending", note: "This refund has not been paid back yet.", tone: "border-amber-200 bg-amber-50 text-amber-900" },
  PROCESSED: { label: "Refunded", note: "The refund was paid back to the customer.", tone: "border-emerald-200 bg-emerald-50 text-emerald-900" },
  FAILED: { label: "Refund failed", note: "This refund did not go through.", tone: "border-red-200 bg-red-50 text-red-900" },
};

const formatDate = (value: string) => new Date(value).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

const TYPE_ICON: Record<string, LucideIcon> = { DELIVERY: MapPin, PICKUP: Package, DINE_IN: UtensilsCrossed };

const humanize = (value?: string) => (value ? value.charAt(0).toUpperCase() + value.slice(1).toLowerCase().replace(/_/g, " ") : "");

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
    <ol aria-label="Order progress" className="isolate grid auto-cols-fr grid-flow-col rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-4">
      {flow.map((step, i) => {
        const done = i < current || (finished && i === current);
        const active = i === current && !finished;
        return (
          <li key={step.status} aria-current={active ? "step" : undefined} className="relative flex flex-col items-center gap-2 text-center">
            {i > 0 && <span aria-hidden="true" className={`absolute right-1/2 top-3 h-[3px] w-full rounded-full ${i <= current ? "bg-emerald-500" : "bg-neutral-200"}`} />}
            <span
              aria-hidden="true"
              className={`relative z-10 flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors duration-200 motion-reduce:transition-none ${
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

const RIDER_STEPS = [
  { status: "ASSIGNED", label: "Accepted the order", time: "assignedAt" },
  { status: "PICKED_UP", label: "Picked it up", time: "pickedUpAt" },
  { status: "ON_THE_WAY", label: "On the way to the customer", time: undefined },
  { status: "DELIVERED", label: "Delivered", time: "deliveredAt" },
] as const;

function RiderDialog({ order, onClose }: { order: OwnerOrderSummary; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const rider = riderOf(order);
  const delivery = order.delivery;
  const current = RIDER_STEPS.findIndex((s) => s.status === delivery?.status);
  const failed = delivery?.status === "FAILED";

  useEffect(() => {
    ref.current?.showModal();
  }, []);

  return (
    <dialog
      ref={ref}
      aria-labelledby="rider-dialog-title"
      onClose={onClose}
      onClick={(e) => e.target === e.currentTarget && e.currentTarget.close()}
      className="m-auto w-[min(26rem,calc(100vw-2rem))] rounded-2xl bg-white p-0 text-neutral-900 shadow-2xl backdrop:bg-neutral-900/50"
    >
      <div className="p-5 sm:p-6">
        <div className="flex items-start gap-3.5">
          <span aria-hidden="true" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#111827] text-sm font-semibold text-white">
            {initials(rider?.name)}
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="rider-dialog-title" className="truncate text-lg font-semibold">
              {rider?.name ?? "Rider"}
            </h2>
            <p className="text-sm text-neutral-500">
              {[rider?.vehicleType ? humanize(rider.vehicleType) : "Delivery rider", delivery?.provider ? `via ${humanize(delivery.provider)}` : ""].filter(Boolean).join(" · ")}
            </p>
          </div>
          <button type="button" aria-label="Close" onClick={() => ref.current?.close()} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-neutral-500 outline-none hover:bg-neutral-100 focus-visible:ring-2 focus-visible:ring-[#E3A008]">
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {rider?.phone ? (
          <a href={`tel:${rider.phone}`} className={`${button} mt-5 w-full bg-[#111827] text-white hover:bg-[#1f2937]`}>
            <Phone size={16} aria-hidden="true" />
            Call {rider.phone}
          </a>
        ) : (
          <p className="mt-5 text-sm text-neutral-500">No phone number on file.</p>
        )}
        {delivery?.trackingUrl && (
          <a href={delivery.trackingUrl} target="_blank" rel="noopener noreferrer" className={`${button} mt-3 w-full border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50`}>
            Track delivery
          </a>
        )}

        <h3 className="mb-3 mt-6 text-sm font-semibold">Delivery progress</h3>
        {failed ? (
          <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-900">The rider could not complete this delivery.</p>
        ) : (
          <ol className="space-y-3">
            {RIDER_STEPS.map((step, i) => {
              const done = i <= current;
              const at = step.time ? delivery?.[step.time] : undefined;
              return (
                <li key={step.status} className={`flex items-center gap-3 text-sm ${done ? "text-neutral-900" : "text-neutral-500"}`}>
                  <span aria-hidden="true" className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${done ? "bg-emerald-500 text-white" : "border-2 border-neutral-300"}`}>
                    {done && <Check size={12} strokeWidth={3} />}
                  </span>
                  <span className="flex-1">
                    {step.label}
                    <span className="sr-only">{done ? ", done" : ", not yet"}</span>
                  </span>
                  {at && <span className="text-xs tabular-nums text-neutral-500">{formatDate(at)}</span>}
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </dialog>
  );
}

function RefundAction({ total, currency, disabled, refunding, onRefund }: { total: number; currency?: string; disabled: boolean; refunding: boolean; onRefund: (amount: number, reason: string) => void }) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(String(total));
  const [reason, setReason] = useState("");
  const value = Number(amount);
  const valid = value > 0 && value <= total && reason.trim().length > 0;
  const field = "mt-1 min-h-11 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm text-neutral-900 outline-none focus-visible:ring-2 focus-visible:ring-[#E3A008] disabled:opacity-50";

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={`${button} border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50`}>
        <RotateCcw size={16} aria-hidden="true" />
        Issue refund
      </button>
    );
  }

  return (
    <form
      aria-labelledby="refund-form-title"
      onSubmit={(e) => {
        e.preventDefault();
        if (valid) onRefund(value, reason.trim());
      }}
      className="space-y-3 rounded-xl border border-neutral-200 p-4"
    >
      <h3 id="refund-form-title" className="text-sm font-semibold text-neutral-900">
        Issue refund
      </h3>
      <p className="text-sm text-neutral-600">Record the money you paid back to the customer. They are told by email. An order can be refunded once.</p>
      <div className="grid gap-3 sm:grid-cols-[10rem_minmax(0,1fr)]">
        <label className="text-xs font-medium text-neutral-700">
          Amount (max {formatMoney(total, currency)})
          <input type="number" inputMode="decimal" min="0.01" max={total} step="0.01" value={amount} disabled={refunding} onChange={(e) => setAmount(e.target.value)} className={field} />
        </label>
        <label className="text-xs font-medium text-neutral-700">
          Reason
          <input type="text" maxLength={300} value={reason} disabled={refunding} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Item missing from delivery" className={field} />
        </label>
      </div>
      <div className="flex flex-wrap justify-end gap-3">
        <button type="button" disabled={refunding} onClick={() => setOpen(false)} className={`${button} border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50`}>
          Close
        </button>
        <button type="submit" disabled={disabled || !valid} className={`${button} bg-[#111827] text-white hover:bg-[#1f2937]`}>
          {refunding && <Loader2 size={16} aria-hidden="true" className="animate-spin motion-reduce:animate-none" />}
          Confirm refund
        </button>
      </div>
    </form>
  );
}

interface OrderDetailProps {
  order: OwnerOrderSummary;
  now: number;
  disabled: boolean;
  pending: boolean;
  refunding: boolean;
  onAdvance: (next: string) => void;
  onCancel: () => void;
  onRefund: (amount: number, reason: string) => void;
  onOwnDelivery: () => void;
}

export function OrderDetail({ order, now, disabled, pending, refunding, onAdvance, onCancel, onRefund, onOwnDelivery }: OrderDetailProps) {
  const [confirming, setConfirming] = useState(false);
  const [ownConfirming, setOwnConfirming] = useState(false);
  const [riderOpen, setRiderOpen] = useState(false);
  const status = (order.status ?? "PENDING").toUpperCase();
  const isNew = status === "PENDING";
  const cancelled = status === "CANCELLED";
  const finished = status === "DELIVERED" || status === "COMPLETED";
  const step = nextStep(status, order.orderType);
  const items = order.items ?? [];
  const placed = order.createdAt ? new Date(order.createdAt) : null;
  const rider = riderOf(order);
  const provider = order.delivery?.provider;
  const partnerDelivery = order.orderType === "DELIVERY" && order.deliveryHandledBy === "THIRD_PARTY";
  const hold =
    partnerDelivery && !rider && !provider && step?.next === "OUT_FOR_DELIVERY"
      ? { label: "Waiting for a delivery partner", hint: "No delivery partner has accepted this order yet. You can send it out once one does." }
      : partnerDelivery && step?.next === "DELIVERED" && order.delivery?.status !== "DELIVERED"
        ? { label: "Waiting for the delivery partner", hint: "The delivery partner confirms the drop-off. You can mark it delivered once they do." }
        : undefined;
  const delivery = order.deliveryFee ?? 0;
  const discount = order.discountAmount ?? 0;
  const refund = order.refund ? REFUND_STATE[order.refund.status ?? ""] : undefined;
  const quantity = items.reduce((sum, i) => sum + (i.quantity ?? 1), 0);

  const facts: { label: string; value: string; icon: LucideIcon; wide?: boolean; onOpen?: () => void }[] = [
    { label: "Order type", value: humanize(order.orderType), icon: TYPE_ICON[order.orderType ?? "PICKUP"] ?? Package },
    { label: "Payment", value: [order.paymentMethod ? (PAYMENT_METHOD[order.paymentMethod] ?? humanize(order.paymentMethod)) : "", humanize(order.paymentStatus)].filter(Boolean).join(" · "), icon: Wallet },
    ...(order.orderType === "DELIVERY" && order.deliveryAddress ? [{ label: "Deliver to", value: order.deliveryAddress, icon: MapPin, wide: true }] : []),
    ...(rider?.name
      ? [{ label: "Rider", value: [rider.name, rider.phone].filter(Boolean).join(" · "), icon: Bike, onOpen: () => setRiderOpen(true) }]
      : provider
        ? [{ label: "Delivery by", value: `${humanize(provider)} · accepted`, icon: Bike, onOpen: () => setRiderOpen(true) }]
        : order.deliveryHandledBy
        ? [{ label: "Delivery by", value: `${HANDLED_BY[order.deliveryHandledBy] ?? humanize(order.deliveryHandledBy)}${order.deliveryHandledBy === "THIRD_PARTY" && status !== "PENDING" ? " · none accepted yet" : ""}`, icon: Bike }]
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
            <p className="text-3xl font-semibold tabular-nums tracking-tight text-neutral-900">{formatMoney(order.total ?? 0, order.currencyCode)}</p>
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

        {refund && (
          <section aria-labelledby="detail-refund" className={`rounded-xl border p-4 ${refund.tone}`}>
            <div className="flex items-start gap-3">
              <RotateCcw size={18} aria-hidden="true" className="mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                  <h3 id="detail-refund" className="text-sm font-semibold">
                    {refund.label}
                  </h3>
                  <p className="text-sm font-semibold tabular-nums">{formatMoney(order.refund?.amount ?? order.total ?? 0, order.currencyCode)}</p>
                </div>
                <p className="mt-1 text-sm">{refund.note}</p>
                {order.refund?.reason && <p className="mt-1 text-sm">Reason: {order.refund.reason}</p>}
                <p className="mt-2 text-xs opacity-80">
                  {order.refund?.processedAt ? `Processed ${formatDate(order.refund.processedAt)}` : order.refund?.createdAt ? `Requested ${formatDate(order.refund.createdAt)}` : ""}
                </p>
              </div>
            </div>
          </section>
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
                <span className="text-sm font-medium tabular-nums text-neutral-700">{formatMoney(item.subtotal ?? (item.unitPrice ?? 0) * (item.quantity ?? 1), order.currencyCode)}</span>
              </li>
            ))}
            {items.length === 0 && <li className="py-3 text-sm text-neutral-500">No items on this order.</li>}
          </ul>

          <dl className="mt-4 space-y-1.5 rounded-xl bg-neutral-50 p-4 text-sm sm:ml-auto sm:max-w-xs">
            <div className="flex justify-between gap-4 text-neutral-600">
              <dt>Subtotal</dt>
              <dd className="tabular-nums">{formatMoney(order.subtotal ?? 0, order.currencyCode)}</dd>
            </div>
            {delivery > 0 && (
              <div className="flex justify-between gap-4 text-neutral-600">
                <dt>Delivery fee</dt>
                <dd className="tabular-nums">{formatMoney(delivery, order.currencyCode)}</dd>
              </div>
            )}
            {discount > 0 && (
              <div className="flex justify-between gap-4 text-emerald-700">
                <dt>Discount{order.couponCode ? ` (${order.couponCode})` : ""}</dt>
                <dd className="tabular-nums">-{formatMoney(discount, order.currencyCode)}</dd>
              </div>
            )}
            <div className="flex items-baseline justify-between gap-4 border-t border-neutral-200 pt-2 text-neutral-900">
              <dt className="font-semibold">Total</dt>
              <dd className="text-lg font-semibold tabular-nums">{formatMoney(order.total ?? 0, order.currencyCode)}</dd>
            </div>
          </dl>
        </section>

        <div className="@container">
          <dl className="grid grid-cols-1 gap-3 @md:grid-cols-2">
            {facts.map(({ label, value, icon: Icon, wide, onOpen }, i) => (
              <div key={label} className={`flex items-center gap-3 rounded-xl border border-neutral-200 p-3 ${wide || (i === facts.length - 1 && oddTiles) ? "@md:col-span-2" : ""}`}>
                <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-neutral-600">
                  <Icon size={16} />
                </span>
                <div className="min-w-0">
                  <dt className="text-xs text-neutral-500">{label}</dt>
                  <dd className="break-words text-sm font-medium text-neutral-900">
                    {value}
                    {onOpen && (
                      <button type="button" id={RIDER_TRIGGER_ID} onClick={onOpen} className="mt-0.5 block min-h-6 rounded text-xs font-semibold text-neutral-700 underline underline-offset-2 outline-none hover:text-neutral-900 focus-visible:ring-2 focus-visible:ring-[#E3A008]">
                        View rider details
                      </button>
                    )}
                  </dd>
                </div>
              </div>
            ))}
          </dl>
        </div>

        {order.paymentStatus === "PAID" && <RefundAction total={order.total ?? 0} currency={order.currencyCode} disabled={disabled} refunding={refunding} onRefund={onRefund} />}
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
            <div className="space-y-3">
              {hold && <p className="text-sm text-neutral-600">{hold.hint}</p>}
              {partnerDelivery && !rider && !provider &&
                (ownConfirming ? (
                  <div role="group" aria-label="Confirm own delivery" className="flex flex-wrap items-center gap-3 rounded-xl bg-neutral-50 p-3">
                    <p className="min-w-[14rem] flex-1 text-sm text-neutral-700">Deliver this order with your own riders? Delivery partners will no longer see it.</p>
                    <button type="button" onClick={() => setOwnConfirming(false)} className={`${button} border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50`}>
                      Keep waiting
                    </button>
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => {
                        setOwnConfirming(false);
                        onOwnDelivery();
                      }}
                      className={`${button} bg-[#111827] text-white hover:bg-[#1f2937]`}
                    >
                      Use my own riders
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => setOwnConfirming(true)}
                    className="flex min-h-11 items-center gap-2 rounded-lg text-sm font-semibold text-neutral-800 underline underline-offset-4 outline-none hover:text-neutral-950 focus-visible:ring-2 focus-visible:ring-[#E3A008] disabled:opacity-50"
                  >
                    <Bike size={16} aria-hidden="true" />
                    Deliver with your own riders instead
                  </button>
                ))}
              <div className="flex gap-3">
                <button type="button" disabled={disabled} onClick={() => setConfirming(true)} className={`${button} border border-neutral-300 bg-white text-neutral-700 hover:border-red-200 hover:bg-red-50 hover:text-red-700`}>
                  {isNew ? "Reject" : "Cancel order"}
                </button>
                <button
                  id={PRIMARY_ACTION_ID}
                  type="button"
                  disabled={disabled || !!hold}
                  onClick={() => onAdvance(step.next)}
                  className={`group ${button} flex-1 active:scale-[0.99] motion-reduce:active:scale-100 ${isNew ? "bg-[#E3A008] text-[#111827] hover:bg-[#d49207]" : "bg-[#111827] text-white hover:bg-[#1f2937]"}`}
                >
                  {pending ? <Loader2 size={16} aria-hidden="true" className="animate-spin motion-reduce:animate-none" /> : null}
                  {hold ? hold.label : step.label}
                  {!pending && !hold && <ArrowRight size={16} aria-hidden="true" className="transition-transform duration-150 group-hover:translate-x-0.5 motion-reduce:transition-none" />}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      {riderOpen && (
        <RiderDialog
          order={order}
          onClose={() => {
            setRiderOpen(false);
            requestAnimationFrame(() => document.getElementById(RIDER_TRIGGER_ID)?.focus());
          }}
        />
      )}
    </article>
  );
}
