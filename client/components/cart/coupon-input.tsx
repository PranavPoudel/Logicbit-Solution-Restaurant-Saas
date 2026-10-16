// components/cart/coupon-input.tsx
"use client";

import { useTranslations } from "next-intl";
import { useCoupon } from "@/hooks/use-coupon";
import { money } from "@/lib/utils/money";
import { Button, Icon, IconButton, inputCls } from "@/components/ui/primitives";

export function CouponInput({ id = "cp" }: { id?: string }) {
  const t = useTranslations("coupon");
  const { coupon, code, setCode, loading, error, apply, remove } = useCoupon();

  if (coupon) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-full bg-herb/15 py-1 pl-4 pr-1 text-herb" role="status">
        <span className="flex items-center gap-2 font-bold">
          <Icon name="check" className="h-5 w-5" />
          {t("applied", { code: coupon.code, amount: money(coupon.discountAmount) })}
        </span>
        <IconButton icon="x" label={t("remove")} onClick={remove} className="hover:bg-herb/15" />
      </div>
    );
  }

  return (
    <div>
      <label htmlFor={id} className="mb-2 block font-bold">{t("have")}</label>
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          apply();
        }}
      >
        <input
          id={id}
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder={t("placeholder")}
          aria-invalid={!!error}
          aria-describedby={`${id}-err`}
          className={`${inputCls} !min-h-11 uppercase ${error ? "!border-chili" : ""}`}
        />
        <Button variant="outline" type="submit" disabled={loading} className="shrink-0">
          {loading ? "…" : t("apply")}
        </Button>
      </form>
      {error && (
        <p id={`${id}-err`} role="alert" className="mt-2 flex items-center gap-2 font-medium text-danger">
          <Icon name="alert" className="h-4 w-4" />
          {error}
        </p>
      )}
    </div>
  );
}
