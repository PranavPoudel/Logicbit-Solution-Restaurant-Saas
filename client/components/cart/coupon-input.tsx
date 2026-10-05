// components/cart/coupon-input.tsx
"use client";

import { useState } from "react";
import { Tag, X } from "lucide-react";

interface CouponInputProps {
  restaurantId: string;
  subtotal: number;
  // Simplified: We just pass the code up. Actual validation & discount calculation 
  // happens securely on the backend during the final checkout submission.
  onApplied: (code: string) => void;
  appliedCode: string | null;
  onRemove: () => void;
}

export function CouponInput({
  onApplied,
  appliedCode,
  onRemove,
}: CouponInputProps) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  // State when a coupon is successfully "applied" (locally)
  if (appliedCode) {
    return (
      <div className="flex items-center justify-between bg-[#0F6B5C]/10 text-[#0F6B5C] text-sm px-3.5 py-2.5 rounded-xl">
        <span className="flex items-center gap-2 font-medium">
          <Tag size={14} />
          {appliedCode} applied
        </span>
        <button 
          onClick={onRemove} 
          aria-label="Remove coupon" 
          className="hover:text-red-500 transition-colors"
        >
          <X size={15} />
        </button>
      </div>
    );
  }

  // State when entering a coupon
  return (
    <div>
      <div className="flex gap-2">
        <input
          aria-label="Coupon code"
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase());
            setError("");
          }}
          placeholder="Coupon code"
          className="flex-1 bg-white border border-[#E8E7E2] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E3A008]/40 focus:border-[#E3A008]"
        />
        <button
          onClick={() => {
            if (!code.trim()) {
              setError("Please enter a code");
              return;
            }
            // No API call here. We trust the code for now and let the backend 
            // validate it during the actual order creation to prevent abuse.
            onApplied(code);
          }}
          className="text-sm font-medium bg-[#17181C] text-white px-4 py-2.5 rounded-xl hover:bg-[#2B2D33] transition-colors"
        >
          Apply
        </button>
      </div>
      {error && (
        <p className="text-xs text-red-600 mt-1.5">{error}</p>
      )}
      <p className="text-[11px] text-neutral-400 mt-1.5">
        * Validity and discount will be verified when you place your order.
      </p>
    </div>
  );
}