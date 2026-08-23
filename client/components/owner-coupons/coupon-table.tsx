// components/owner-coupons/coupon-table.tsx
"use client";

import { useState } from "react";
import { Plus, Trash2, Tag } from "lucide-react";

export interface OwnerCoupon {
  id: string;
  code?: string;
  discountType?: string;
  discountValue?: number;
  minSubtotal?: number;
  expiresAt?: string;
}

interface CouponTableProps {
  coupons: OwnerCoupon[];
  onAdd: (input: {
    code: string;
    discountType: "PERCENTAGE" | "FLAT";
    discountValue: number;
  }) => void;
  onDelete: (id: string) => void;
  isAdding: boolean;
}

export function CouponTable({ coupons, onAdd, onDelete, isAdding }: CouponTableProps) {
  const [showForm, setShowForm] = useState(false);
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<"PERCENTAGE" | "FLAT">("PERCENTAGE");
  const [discountValue, setDiscountValue] = useState("");

  function submit() {
    const value = Number(discountValue);
    if (!code.trim() || !value) return;
    onAdd({ code: code.trim().toUpperCase(), discountType, discountValue: value });
    setCode("");
    setDiscountValue("");
    setShowForm(false);
  }

  return (
    <div className="bg-white border border-neutral-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-neutral-800">Coupons</h3>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 text-xs font-medium bg-[#1B2333] text-white px-3 py-1.5 rounded-md"
        >
          <Plus size={13} />
          Add coupon
        </button>
      </div>

      {showForm && (
        <div className="border border-neutral-200 rounded-lg p-3 mb-3 space-y-2">
          <input
            autoFocus
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="CODE (e.g. WELCOME100)"
            className="w-full text-sm border border-neutral-200 rounded-md px-2.5 py-1.5 font-mono focus:outline-none focus:ring-2 focus:ring-[#E3A008]/40"
          />
          <div className="flex gap-2">
            <select
              value={discountType}
              onChange={(e) => setDiscountType(e.target.value as "PERCENTAGE" | "FLAT")}
              className="text-sm border border-neutral-200 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#E3A008]/40"
            >
              <option value="PERCENTAGE">% off</option>
              <option value="FLAT">Rs off</option>
            </select>
            <input
              value={discountValue}
              onChange={(e) => setDiscountValue(e.target.value)}
              placeholder="Value"
              type="number"
              className="flex-1 text-sm border border-neutral-200 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#E3A008]/40"
            />
          </div>
          <div className="flex gap-1.5">
            <button
              onClick={submit}
              disabled={isAdding}
              className="text-xs font-medium bg-[#1B2333] text-white px-3 py-1.5 rounded-md disabled:opacity-50"
            >
              {isAdding ? "Saving…" : "Save coupon"}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="text-xs text-neutral-500 px-3 py-1.5"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {coupons.length === 0 ? (
        <p className="text-sm text-neutral-400 text-center py-8">No coupons yet.</p>
      ) : (
        <ul className="divide-y divide-neutral-100">
          {coupons.map((coupon) => (
            <li key={coupon.id} className="group flex items-center justify-between py-3">
              <span className="flex items-center gap-2">
                <Tag size={14} className="text-[#E3A008]" />
                <span className="text-sm font-mono font-medium text-neutral-800">
                  {coupon.code}
                </span>
              </span>
              <div className="flex items-center gap-3">
                <span className="text-xs text-neutral-500">
                  {coupon.discountType === "FLAT"
                    ? `Rs ${coupon.discountValue} off`
                    : `${coupon.discountValue}% off`}
                </span>
                <button
                  onClick={() => onDelete(coupon.id)}
                  className="opacity-0 group-hover:opacity-100 text-neutral-300 hover:text-red-500"
                  aria-label="Delete coupon"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
