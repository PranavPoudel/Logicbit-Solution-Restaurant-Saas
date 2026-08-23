// components/cart/coupon-input.tsx
"use client";

import { useState } from "react";
import { Tag, X } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { validateCoupon } from "@/lib/api/coupons";

interface CouponInputProps {
  restaurantId: string;
  subtotal: number;
  onApplied: (discount: number, code: string) => void;
  appliedCode: string | null;
  onRemove: () => void;
}

export function CouponInput({
  restaurantId,
  subtotal,
  onApplied,
  appliedCode,
  onRemove,
}: CouponInputProps) {
  const [code, setCode] = useState("");

  const mutation = useMutation({
    mutationFn: () => validateCoupon({ restaurantId, code, subtotal }),
    onSuccess: (data) => {
      // TODO: confirm exact response shape via Swagger — assumed
      // { valid, discountAmount, message }.
      if (data?.valid !== false) {
        onApplied(data?.discountAmount ?? 0, code);
      }
    },
  });

  if (appliedCode) {
    return (
      <div className="flex items-center justify-between bg-[#0F6B5C]/8 text-[#0F6B5C] text-sm px-3.5 py-2.5 rounded-xl">
        <span className="flex items-center gap-2 font-medium">
          <Tag size={14} />
          {appliedCode} applied
        </span>
        <button onClick={onRemove} aria-label="Remove coupon">
          <X size={15} />
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex gap-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Coupon code"
          className="flex-1 bg-white border border-[#E8E7E2] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E3A008]/40 focus:border-[#E3A008]"
        />
        <button
          onClick={() => code && mutation.mutate()}
          disabled={!code || mutation.isPending}
          className="text-sm font-medium bg-[#17181C] text-white px-4 py-2.5 rounded-xl disabled:opacity-50"
        >
          {mutation.isPending ? "Checking…" : "Apply"}
        </button>
      </div>
      {mutation.isError && (
        <p className="text-xs text-red-600 mt-1.5">Couldn&apos;t validate this code.</p>
      )}
      {mutation.isSuccess && mutation.data?.valid === false && (
        <p className="text-xs text-red-600 mt-1.5">
          {mutation.data?.message ?? "This coupon isn't valid."}
        </p>
      )}
    </div>
  );
}
