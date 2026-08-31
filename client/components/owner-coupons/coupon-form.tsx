"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import type { OwnerCoupon } from "./coupon-table";

export interface CouponFormData {
  code: string;
  discountType: "PERCENTAGE" | "FLAT";
  discountValue: number;
  minSubtotal?: number;
  maxDiscount?: number;
  validFrom?: string;
  expiresAt?: string;
  usageLimit?: number;
  usageLimitPerCustomer?: number;
}

interface CouponFormProps {
  coupon: OwnerCoupon | null;
  onSubmit: (data: CouponFormData) => void;
  onCancel: () => void;
  isLoading: boolean;
}

export function CouponForm({ coupon, onSubmit, onCancel, isLoading }: CouponFormProps) {
  const [formData, setFormData] = useState<CouponFormData>({
    code: "",
    discountType: "FLAT",
    discountValue: 0,
    minSubtotal: undefined,
    maxDiscount: undefined,
    validFrom: "",
    expiresAt: "",
    usageLimit: undefined,
    usageLimitPerCustomer: undefined,
  });

  // Populate form when editing
  useEffect(() => {
    if (coupon) {
      setFormData({
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        minSubtotal: coupon.minSubtotal || undefined,
        maxDiscount: coupon.maxDiscount || undefined,
        validFrom: coupon.validFrom ? new Date(coupon.validFrom).toISOString().split("T")[0] : "",
        expiresAt: coupon.expiresAt ? new Date(coupon.expiresAt).toISOString().split("T")[0] : "",
        usageLimit: coupon.usageLimit || undefined,
        usageLimitPerCustomer: coupon.usageLimitPerCustomer || undefined,
      });
    }
  }, [coupon]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-900">
            {coupon ? "Edit Coupon" : "Create Coupon"}
          </h2>
          <button
            onClick={onCancel}
            className="p-1 hover:bg-neutral-100 rounded-full"
          >
            <X size={20} className="text-neutral-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Code */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Coupon Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              placeholder="e.g., WELCOME10"
              className="w-full px-3.5 py-2.5 text-sm border border-neutral-200 rounded-lg focus:ring-2 focus:ring-[#E3A008]/40 focus:border-[#E3A008] outline-none uppercase"
              required
              maxLength={30}
            />
          </div>

          {/* Discount Type & Value */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Discount Type <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.discountType}
                onChange={(e) => setFormData({ ...formData, discountType: e.target.value as "PERCENTAGE" | "FLAT" })}
                className="w-full px-3.5 py-2.5 text-sm border border-neutral-200 rounded-lg focus:ring-2 focus:ring-[#E3A008]/40 focus:border-[#E3A008] outline-none"
              >
                <option value="FLAT">Flat Amount</option>
                <option value="PERCENTAGE">Percentage</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Discount Value <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.discountValue}
                onChange={(e) => setFormData({ ...formData, discountValue: Number(e.target.value) })}
                placeholder={formData.discountType === "PERCENTAGE" ? "10" : "100"}
                min={0}
                className="w-full px-3.5 py-2.5 text-sm border border-neutral-200 rounded-lg focus:ring-2 focus:ring-[#E3A008]/40 focus:border-[#E3A008] outline-none"
                required
              />
              <p className="text-xs text-neutral-500 mt-1">
                {formData.discountType === "PERCENTAGE" ? "Percentage (e.g., 10 for 10%)" : "Amount in NPR (e.g., 100)"}
              </p>
            </div>
          </div>

          {/* Max Discount (for percentage) */}
          {formData.discountType === "PERCENTAGE" && (
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Max Discount Amount
              </label>
              <input
                type="number"
                value={formData.maxDiscount || ""}
                onChange={(e) => setFormData({ ...formData, maxDiscount: Number(e.target.value) || undefined })}
                placeholder="500"
                min={0}
                className="w-full px-3.5 py-2.5 text-sm border border-neutral-200 rounded-lg focus:ring-2 focus:ring-[#E3A008]/40 focus:border-[#E3A008] outline-none"
              />
              <p className="text-xs text-neutral-500 mt-1">
                Maximum discount cap (optional)
              </p>
            </div>
          )}

          {/* Min Order Amount */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Minimum Order Amount
            </label>
            <input
              type="number"
              value={formData.minSubtotal || ""}
              onChange={(e) => setFormData({ ...formData, minSubtotal: Number(e.target.value) || undefined })}
              placeholder="500"
              min={0}
              className="w-full px-3.5 py-2.5 text-sm border border-neutral-200 rounded-lg focus:ring-2 focus:ring-[#E3A008]/40 focus:border-[#E3A008] outline-none"
            />
          </div>

          {/* Validity Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Valid From
              </label>
              <input
                type="date"
                value={formData.validFrom}
                onChange={(e) => setFormData({ ...formData, validFrom: e.target.value || undefined })}
                className="w-full px-3.5 py-2.5 text-sm border border-neutral-200 rounded-lg focus:ring-2 focus:ring-[#E3A008]/40 focus:border-[#E3A008] outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Valid Until (Expiry)
              </label>
              <input
                type="date"
                value={formData.expiresAt}
                onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value || undefined })}
                className="w-full px-3.5 py-2.5 text-sm border border-neutral-200 rounded-lg focus:ring-2 focus:ring-[#E3A008]/40 focus:border-[#E3A008] outline-none"
              />
            </div>
          </div>

          {/* Usage Limits */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Total Usage Limit
              </label>
              <input
                type="number"
                value={formData.usageLimit || ""}
                onChange={(e) => setFormData({ ...formData, usageLimit: Number(e.target.value) || undefined })}
                placeholder="100"
                min={1}
                className="w-full px-3.5 py-2.5 text-sm border border-neutral-200 rounded-lg focus:ring-2 focus:ring-[#E3A008]/40 focus:border-[#E3A008] outline-none"
              />
              <p className="text-xs text-neutral-500 mt-1">Total times this coupon can be used</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Per Customer Limit
              </label>
              <input
                type="number"
                value={formData.usageLimitPerCustomer || ""}
                onChange={(e) => setFormData({ ...formData, usageLimitPerCustomer: Number(e.target.value) || undefined })}
                placeholder="1"
                min={1}
                className="w-full px-3.5 py-2.5 text-sm border border-neutral-200 rounded-lg focus:ring-2 focus:ring-[#E3A008]/40 focus:border-[#E3A008] outline-none"
              />
              <p className="text-xs text-neutral-500 mt-1">Times each customer can use</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-neutral-200">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-neutral-700 bg-neutral-100 rounded-lg hover:bg-neutral-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !formData.code || formData.discountValue <= 0}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-[#1B2333] rounded-lg hover:bg-[#2B2D33] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Saving..." : coupon ? "Update Coupon" : "Create Coupon"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}