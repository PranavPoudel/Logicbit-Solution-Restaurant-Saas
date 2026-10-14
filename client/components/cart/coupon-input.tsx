"use client";

import { AlertCircle, CheckCircle2, Tag, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCoupon } from "@/hooks/use-coupon";

export function CouponBox({ dark = false }: { dark?: boolean }) {
  const t = useTranslations("checkout");
  const { coupon, code, setCode, loading, error, apply, remove } = useCoupon();

  const inputClass = dark
    ? "border-brand-background/25 bg-transparent text-brand-background placeholder:text-brand-background/50 focus:border-brand-background"
    : "border-[#E8E7E2] focus:border-[#E3A008] focus:ring-2 focus:ring-[#E3A008]/40";
  const buttonClass = dark
    ? "bg-brand-background text-brand-dark hover:bg-white"
    : "bg-brand-ink text-white hover:bg-brand-ink-hover";

  return (
    <div>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Tag size={16} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" />
          <input
            aria-label={t("placeholders.coupon")}
            type="text"
            value={coupon ? coupon.code : code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && !coupon && apply()}
            disabled={!!coupon}
            placeholder={t("placeholders.coupon")}
            className={`w-full rounded-xl border py-2.5 pl-10 pr-3 text-sm outline-none ${inputClass}`}
          />
        </div>
        {coupon ? (
          <button
            type="button"
            onClick={remove}
            className="flex items-center gap-1.5 rounded-xl border border-current/25 px-4 py-2.5 text-sm font-medium opacity-80 hover:opacity-100"
          >
            <X size={14} /> Remove
          </button>
        ) : (
          <button
            type="button"
            onClick={apply}
            disabled={loading}
            className={`rounded-xl px-5 py-2.5 text-sm font-medium transition-colors disabled:opacity-50 ${buttonClass}`}
          >
            {loading ? "…" : t("apply")}
          </button>
        )}
      </div>
      {error && (
        <div role="alert" className="mt-3 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
          <AlertCircle size={16} className="shrink-0" />
          {error}
        </div>
      )}
      {coupon && (
        <div role="status" className="mt-3 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-3.5 py-2.5 text-sm font-medium text-green-700">
          <CheckCircle2 size={16} className="shrink-0" />
          {`Coupon ${coupon.code} applied. You save Rs ${coupon.discountAmount}!`}
        </div>
      )}
    </div>
  );
}
