// components/owner-subscription/plan-picker.tsx
"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AlertCircle, Check, CreditCard, Loader2, Lock, Smartphone } from "lucide-react";
import { subscriptionPaymentsApi, type SubscriptionPaymentMethod } from "@/lib/api/subscription-payments";
import { formatMoney } from "@/lib/utils/money";
import { getErrorMessage } from "@/lib/utils/error";
import { accessUntil } from "@/lib/utils/subscription";

const methods: { value: SubscriptionPaymentMethod; label: string; hint: string; icon: typeof CreditCard }[] = [
  { value: "PAYPAY", label: "PayPay", hint: "Pay with your PayPay wallet", icon: Smartphone },
  { value: "CARD", label: "Card", hint: "Credit or debit card", icon: CreditCard },
];

const ring = "peer-focus-visible:ring-2 peer-focus-visible:ring-[#E3A008] peer-focus-visible:ring-offset-2";
const choice = (selected: boolean) =>
  `block rounded-xl border transition-colors motion-reduce:transition-none ${ring} ${
    selected ? "border-[#E3A008] bg-[#E3A008]/10" : "border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50"
  }`;

const periodLabel = (months: number) => (months === 0 ? "Lifetime" : months === 1 ? "Monthly" : months === 12 ? "Yearly" : `${months} months`);
const priceSuffix = (months: number) => (months === 0 ? "one-time" : months === 1 ? "/ month" : months === 12 ? "/ year" : `/ ${months} months`);
const accessLine = (months: number) => (months === 0 ? "Pay once, no renewals" : months === 1 ? "Access for 1 month" : months === 12 ? "Access for 1 year" : `Access for ${months} months`);
const longDate = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

interface PlanPickerProps {
  restaurantId: string;
  title: string;
  currentPlanId?: string;
  currentExpiry?: string | null;
}

export function PlanPicker({ restaurantId, title, currentPlanId, currentExpiry }: PlanPickerProps) {
  const [planId, setPlanId] = useState("");
  const [method, setMethod] = useState<SubscriptionPaymentMethod | "">("");
  const [period, setPeriod] = useState<number | null>(null);

  const plansQuery = useQuery({
    queryKey: ["subscription-plans", restaurantId],
    queryFn: () => subscriptionPaymentsApi.plans(restaurantId),
  });

  const checkout = useMutation({
    mutationFn: () => subscriptionPaymentsApi.checkout(restaurantId, { planId, method: method as SubscriptionPaymentMethod }),
    onSuccess: ({ redirectUrl }) => {
      window.location.assign(redirectUrl);
    },
  });

  const plans = (plansQuery.data ?? []).filter((p) => p.price > 0);
  const periods = [...new Set(plans.map((p) => p.durationMonths))].sort((a, b) => (a || Infinity) - (b || Infinity));
  const currentPeriod = plans.find((p) => p.id === currentPlanId)?.durationMonths;
  const activePeriod = period ?? currentPeriod ?? periods[0];
  const visible = plans.filter((p) => p.durationMonths === activePeriod).sort((a, b) => a.price - b.price);
  const selected = plans.find((p) => p.id === planId);
  const until = selected ? accessUntil(currentExpiry, selected.durationMonths) : null;

  const choosePeriod = (months: number) => {
    setPeriod(months);
    if (selected && selected.durationMonths !== months) setPlanId("");
  };

  return (
    <section aria-labelledby="plan-picker-title" className="rounded-xl border border-neutral-200 bg-white p-6">
      <h2 id="plan-picker-title" className="mb-6 text-lg font-semibold text-neutral-900">{title}</h2>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-7">
          <fieldset className="min-w-0 space-y-3">
            <legend className="text-sm font-semibold text-neutral-900">Plan</legend>

            {plansQuery.isLoading && <div className="h-28 animate-pulse rounded-xl bg-neutral-100 motion-reduce:animate-none" />}
            {plansQuery.isError && <p className="text-sm text-red-600">Couldn&apos;t load plans. Please try again.</p>}
            {plansQuery.isSuccess && plans.length === 0 && <p className="text-sm text-neutral-500">No paid plans are available right now. Contact support.</p>}

            {periods.length > 1 && (
              <div role="radiogroup" aria-label="Billing period" className="inline-flex flex-wrap gap-1 rounded-lg bg-neutral-100 p-1">
                {periods.map((months) => (
                  <label key={months} className="relative cursor-pointer">
                    <input type="radio" name="billing-period" className="peer sr-only" checked={months === activePeriod} onChange={() => choosePeriod(months)} />
                    <span
                      className={`flex min-h-11 items-center rounded-md px-4 text-sm font-medium transition-colors motion-reduce:transition-none peer-focus-visible:ring-2 peer-focus-visible:ring-[#E3A008] ${
                        months === activePeriod ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-600 hover:text-neutral-900"
                      }`}
                    >
                      {periodLabel(months)}
                    </span>
                  </label>
                ))}
              </div>
            )}

            <div role="radiogroup" aria-label="Plan" className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(15rem,1fr))]">
              {visible.map((p) => {
                const active = p.id === planId;
                return (
                  <label key={p.id} className="relative cursor-pointer">
                    <input type="radio" name="plan" className="peer sr-only" checked={active} onChange={() => setPlanId(p.id)} />
                    <span className={`${choice(active)} flex min-h-28 flex-col gap-1 p-4`}>
                      <span className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-neutral-900">{p.name}</span>
                        {p.id === currentPlanId ? (
                          <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-600">Current plan</span>
                        ) : (
                          active && <Check size={16} aria-hidden="true" className="text-[#E3A008]" />
                        )}
                      </span>
                      <span className="flex flex-wrap items-baseline gap-x-1.5">
                        <span className="text-2xl font-bold tabular-nums text-neutral-900">{formatMoney(p.price)}</span>
                        <span className="whitespace-nowrap text-sm text-neutral-500">{priceSuffix(p.durationMonths)}</span>
                      </span>
                      <span className="text-xs text-neutral-500">
                        {accessLine(p.durationMonths)}
                        {p.durationMonths > 1 && ` · ≈ ${formatMoney(Math.round(p.price / p.durationMonths))} / month`}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <fieldset className="min-w-0 space-y-3">
            <legend className="text-sm font-semibold text-neutral-900">Pay with</legend>
            <div role="radiogroup" aria-label="Payment method" className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(15rem,1fr))]">
              {methods.map(({ value, label, hint, icon: Icon }) => {
                const active = value === method;
                return (
                  <label key={value} className="relative cursor-pointer">
                    <input type="radio" name="payment-method" className="peer sr-only" checked={active} onChange={() => setMethod(value)} />
                    <span className={`${choice(active)} flex min-h-16 items-center gap-3 px-4 py-3`}>
                      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${active ? "bg-[#111827] text-white" : "bg-neutral-100 text-neutral-500"}`}>
                        <Icon size={18} aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium text-neutral-900">{label}</span>
                        <span className="block text-xs text-neutral-500">{hint}</span>
                      </span>
                      {active && <Check size={16} aria-hidden="true" className="shrink-0 text-[#E3A008]" />}
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        </div>

        <aside aria-label="Order summary" className="h-fit space-y-4 rounded-xl bg-neutral-50 p-5 xl:sticky xl:top-6">
          <h3 className="text-sm font-semibold text-neutral-900">Order summary</h3>

          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-neutral-500">Plan</dt>
              <dd className="text-right font-medium text-neutral-900">{selected?.name ?? "Not chosen"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-neutral-500">Period</dt>
              <dd className="text-right text-neutral-900">{selected ? periodLabel(selected.durationMonths) : "-"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-neutral-500">Access until</dt>
              <dd className="text-right text-neutral-900">{selected ? (until ? longDate(until) : "No expiry") : "-"}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-4 border-t border-neutral-200 pt-3">
              <dt className="font-semibold text-neutral-900">Total</dt>
              <dd className="text-xl font-bold tabular-nums text-neutral-900">{selected ? formatMoney(selected.price) : "-"}</dd>
            </div>
          </dl>

          {checkout.isError && (
            <p role="alert" className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle size={16} aria-hidden="true" className="mt-0.5 shrink-0" />
              {getErrorMessage(checkout.error, "Couldn't start the payment. Please try again.")}
            </p>
          )}

          <button
            type="button"
            disabled={!planId || !method || checkout.isPending}
            onClick={() => checkout.mutate()}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#111827] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#1f2937] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40 motion-reduce:transition-none motion-reduce:active:scale-100 outline-none focus-visible:ring-2 focus-visible:ring-[#E3A008] focus-visible:ring-offset-2"
          >
            {checkout.isPending && <Loader2 size={16} aria-hidden="true" className="animate-spin motion-reduce:animate-none" />}
            {checkout.isPending ? "Starting payment…" : selected ? `Pay ${formatMoney(selected.price)}` : "Pay"}
          </button>

          <p className="flex items-start gap-2 text-xs text-neutral-500">
            <Lock size={14} aria-hidden="true" className="mt-0.5 shrink-0" />
            {!selected || !method ? "Choose a plan and a payment method to continue." : "You'll finish on a secure payment page. Card details are never entered on our site."}
          </p>
        </aside>
      </div>
    </section>
  );
}
