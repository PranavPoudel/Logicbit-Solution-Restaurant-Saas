// components/owner-orders/order-detail.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowRight, Bike, Check, ChevronRight, Clock, Loader2, MapPin, Package, Phone, RotateCcw, UtensilsCrossed, Wallet, X, type LucideIcon } from "lucide-react";
import type { OwnerOrderSummary } from "@/types/order";
import { formatMoney } from "@/lib/utils/money";
import { ageLabel, flowFor, minutesSince, nextStep, shortNumber, stepIndex } from "@/lib/utils/order-flow";
import { riderOf } from "@/lib/utils/order-rider";
import { describeRefundPayback, REFUND_METHODS, type RefundMethod } from "@/lib/utils/refund";

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

export interface RefundRequest {
  amount: number;
  reason: string;
  method: RefundMethod;
  reference?: string;
}

interface RefundActionProps {
  total: number;
  currency?: string;
  paidWithPayPay: boolean;
  initialAmount: number;
  disabled: boolean;
  refunding: boolean;
  onRefund: (request: RefundRequest) => void;
}

const REFUND_REASONS = ["Item missing", "Wrong item", "Late delivery", "Quality issue"];

function RefundAction({ total, currency, paidWithPayPay, initialAmount, disabled, refunding, onRefund }: RefundActionProps) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(String(initialAmount));
  const [reason, setReason] = useState("");
  const [method, setMethod] = useState<RefundMethod>(paidWithPayPay ? "PAYPAY" : "CASH");
  const [reference, setReference] = useState("");
  const [touched, setTouched] = useState({ amount: false, reason: false });
  const value = Number(amount);
  const amountError = !(value > 0) ? "Enter an amount above 0" : value > total ? `It can't be more than ${formatMoney(total, currency)}` : "";
  const reasonError = reason.trim() ? "" : "Say why. The customer sees this in their email";
  const viaPayPay = method === "PAYPAY" && paidWithPayPay;
  const methodLabel = REFUND_METHODS.find((m) => m.value === method)?.label ?? "";
  const half = Math.round((total / 2) * 100) / 100;
  const field = "mt-1.5 min-h-11 w-full rounded-lg border bg-white px-3 text-base text-neutral-900 outline-none focus-visible:ring-2 focus-visible:ring-[#E3A008] disabled:opacity-50 sm:text-sm";
  const chip = "inline-flex min-h-11 items-center rounded-full border px-4 text-sm font-medium transition-colors duration-150 motion-reduce:transition-none outline-none focus-visible:ring-2 focus-visible:ring-[#E3A008] focus-visible:ring-offset-1 disabled:opacity-50";
  const chipOff = "border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50";
  const chipOn = "border-[#111827] bg-[#111827] text-white";

  const error = (id: string, message: string) => (
    <p id={id} role="alert" className="mt-1.5 flex items-start gap-1.5 text-xs font-medium text-red-700">
      <AlertCircle size={14} aria-hidden="true" className="mt-px shrink-0" />
      {message}
    </p>
  );

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
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        if (amountError || reasonError) {
          setTouched({ amount: true, reason: true });
          document.getElementById(amountError ? "refund-amount" : "refund-reason")?.focus();
          return;
        }
        onRefund({ amount: value, reason: reason.trim(), method, reference: viaPayPay ? undefined : reference.trim() || undefined });
      }}
      className="space-y-5 rounded-xl border border-neutral-200 p-4 sm:p-5"
    >
      <div>
        <h3 id="refund-form-title" className="text-base font-semibold text-neutral-900">
          Issue refund
        </h3>
        <p className="mt-1 text-sm text-neutral-600">
          {viaPayPay
            ? "Sent to the customer's PayPay from your PayPay account. It counts as refunded once PayPay confirms."
            : "Record money you already paid back. The customer is told by email. An order can be refunded once."}
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-[12rem_minmax(0,1fr)]">
        <div>
          <label htmlFor="refund-amount" className="text-sm font-medium text-neutral-800">
            Amount
          </label>
          <input
            id="refund-amount"
            type="number"
            inputMode="decimal"
            min="0.01"
            max={total}
            step="0.01"
            value={amount}
            disabled={refunding}
            aria-invalid={touched.amount && !!amountError}
            aria-describedby={touched.amount && amountError ? "refund-amount-error" : "refund-amount-hint"}
            onChange={(e) => setAmount(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, amount: true }))}
            className={`${field} ${touched.amount && amountError ? "border-red-500" : "border-neutral-300"}`}
          />
          {touched.amount && amountError ? error("refund-amount-error", amountError) : <p id="refund-amount-hint" className="mt-1.5 text-xs text-neutral-500">Up to {formatMoney(total, currency)}</p>}
          <div className="mt-2 flex flex-wrap gap-2">
            <button type="button" disabled={refunding} aria-pressed={value === total} onClick={() => setAmount(String(total))} className={`${chip} ${value === total ? chipOn : chipOff}`}>
              Full
            </button>
            <button type="button" disabled={refunding} aria-pressed={value === half} onClick={() => setAmount(String(half))} className={`${chip} ${value === half ? chipOn : chipOff}`}>
              Half
            </button>
            <button type="button" disabled={refunding} aria-pressed={value !== total && value !== half} onClick={() => { setAmount(""); document.getElementById("refund-amount")?.focus(); }} className={`${chip} ${value !== total && value !== half ? chipOn : chipOff}`}>
              Custom
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="refund-reason" className="text-sm font-medium text-neutral-800">
            Reason
          </label>
          <input
            id="refund-reason"
            type="text"
            maxLength={300}
            value={reason}
            disabled={refunding}
            aria-invalid={touched.reason && !!reasonError}
            aria-describedby={touched.reason && reasonError ? "refund-reason-error" : undefined}
            onChange={(e) => setReason(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, reason: true }))}
            placeholder="e.g. Item missing from delivery"
            className={`${field} ${touched.reason && reasonError ? "border-red-500" : "border-neutral-300"}`}
          />
          {touched.reason && reasonError && error("refund-reason-error", reasonError)}
          <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Common reasons">
            {REFUND_REASONS.map((r) => (
              <button key={r} type="button" disabled={refunding} onClick={() => setReason(r)} className={`${chip} ${reason === r ? chipOn : chipOff}`}>
                {r}
              </button>
            ))}
            <button type="button" disabled={refunding} aria-pressed={!!reason && !REFUND_REASONS.includes(reason)} onClick={() => { setReason(""); document.getElementById("refund-reason")?.focus(); }} className={`${chip} ${reason && !REFUND_REASONS.includes(reason) ? chipOn : chipOff}`}>
              Custom
            </button>
          </div>
        </div>
      </div>

      <fieldset disabled={refunding} className="min-w-0">
        <legend className="text-sm font-medium text-neutral-800">Paid back by</legend>
        <div className="mt-1.5 grid grid-cols-2 gap-2 sm:grid-cols-[repeat(auto-fit,minmax(8rem,1fr))]">
          {REFUND_METHODS.map((m) => (
            <label
              key={m.value}
              className="relative flex min-h-11 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-3 text-sm font-medium text-neutral-700 transition-colors duration-150 hover:bg-neutral-50 has-[:checked]:border-[#111827] has-[:checked]:bg-[#111827] has-[:checked]:text-white has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[#E3A008] has-[:focus-visible]:ring-offset-1 has-[:disabled]:opacity-50 motion-reduce:transition-none"
            >
              <input type="radio" name="refund-method" value={m.value} checked={method === m.value} onChange={() => setMethod(m.value)} className="sr-only" />
              {method === m.value && <Check size={16} aria-hidden="true" />}
              {m.label}
            </label>
          ))}
        </div>
        {method === "PAYPAY" && !paidWithPayPay && (
          <p className="mt-2 text-xs text-neutral-500">The customer didn&apos;t pay with PayPay, so you send the money yourself and it&apos;s recorded here.</p>
        )}
      </fieldset>

      {!viaPayPay && (
        <div>
          <label htmlFor="refund-reference" className="text-sm font-medium text-neutral-800">
            Reference <span className="font-normal text-neutral-500">(optional)</span>
          </label>
          <input id="refund-reference" type="text" maxLength={100} value={reference} disabled={refunding} aria-describedby="refund-reference-hint" onChange={(e) => setReference(e.target.value)} placeholder="e.g. transfer number" className={`${field} border-neutral-300`} />
          <p id="refund-reference-hint" className="mt-1.5 text-xs text-neutral-500">
            A transfer or receipt number, so you can trace this payment later. The customer sees it too.
          </p>
        </div>
      )}

      <p aria-live="polite" className="min-h-5 text-sm text-neutral-700">
        {!amountError && !reasonError && (
          <>
            <span className="font-semibold tabular-nums">{formatMoney(value, currency)}</span> goes back to the customer {viaPayPay ? "through PayPay" : method === "PAYPAY" ? "by PayPay" : `by ${methodLabel.toLowerCase()}`}.
          </>
        )}
      </p>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button type="button" disabled={refunding} onClick={() => setOpen(false)} className={`${button} border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50`}>
          Close
        </button>
        <button type="submit" disabled={disabled || refunding} className={`${button} bg-[#111827] text-white hover:bg-[#1f2937]`}>
          {refunding && <Loader2 size={16} aria-hidden="true" className="animate-spin motion-reduce:animate-none" />}
          {viaPayPay ? "Send refund to PayPay" : "Confirm refund"}
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
  onRefund: (request: RefundRequest) => void;
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
                {order.refund?.status === "PROCESSED" && describeRefundPayback(order.refund.method, order.refund.reference) && (
                  <p className="mt-1 text-sm">Paid back by {describeRefundPayback(order.refund.method, order.refund.reference)}</p>
                )}
                {order.refund?.status === "FAILED" && order.refund.failureReason && <p className="mt-1 text-sm">PayPay said: {order.refund.failureReason}</p>}
                {order.refund?.status === "PENDING" && order.refund.method === "PAYPAY" && (
                  <p className="mt-1 text-sm">PayPay has not finished this refund yet. Press Issue refund again to check it.</p>
                )}
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

        {order.paymentStatus === "PAID" && (
          <RefundAction
            key={`${order.id}-${order.refund?.status ?? "none"}`}
            total={order.total ?? 0}
            currency={order.currencyCode}
            paidWithPayPay={order.paymentMethod === "PAYPAY"}
            initialAmount={order.refund?.amount ?? order.total ?? 0}
            disabled={disabled}
            refunding={refunding}
            onRefund={onRefund}
          />
        )}
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
