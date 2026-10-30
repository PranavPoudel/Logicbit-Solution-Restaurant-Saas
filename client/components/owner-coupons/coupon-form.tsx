// components/owner-coupons/coupon-form.tsx
"use client";

import { useState, useEffect } from "react";
import { X, Tag, Percent, Banknote, Calendar, Users, Shield, Zap } from "lucide-react";
import { FormField } from "@/components/ui/form-field";
import { useCurrencyCode } from "@/hooks/use-money";

export interface CouponFormData {
  code?: string;
  discountType: "PERCENTAGE" | "FLAT";
  discountValue: number | "";
  minSubtotal?: number | "";
  maxDiscount?: number | "";
  usageLimit?: number | "";
  usageLimitPerCustomer?: number | "";
  validFrom?: string;
  expiresAt?: string;
  isAutoApply?: boolean;
}

interface CouponFormProps {
  coupon: any | null;
  onSubmit: (data: CouponFormData) => void;
  onCancel: () => void;
  isLoading: boolean;
}

export function CouponForm({ coupon, onSubmit, onCancel, isLoading }: CouponFormProps) {
  const currency = useCurrencyCode();
  const [formData, setFormData] = useState<CouponFormData>({
    code: "",
    discountType: "PERCENTAGE",
    discountValue: "",
    minSubtotal: "",
    maxDiscount: "",
    usageLimit: "",
    usageLimitPerCustomer: "",
    validFrom: new Date().toISOString().split("T")[0],
    expiresAt: "",
    isAutoApply: false,
  });

  useEffect(() => {
    if (coupon) {
      setFormData({
        code: coupon.code || "",
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        minSubtotal: coupon.minSubtotal || "",
        maxDiscount: coupon.maxDiscount || "",
        usageLimit: coupon.usageLimit || "",
        usageLimitPerCustomer: coupon.usageLimitPerCustomer || "",
        validFrom: coupon.validFrom ? new Date(coupon.validFrom).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
        expiresAt: coupon.expiresAt ? new Date(coupon.expiresAt).toISOString().split("T")[0] : "",
        isAutoApply: coupon.isAutoApply || false,
      });
    }
  }, [coupon]);

  const handleChange = (field: keyof CouponFormData, value: any) => {
    if (field === "isAutoApply" && value === true) {
      // Clear code when switching to auto-apply
      setFormData((prev) => ({ ...prev, [field]: value, code: "" }));
    } else if (field === "discountValue" || field === "minSubtotal" || field === "maxDiscount" || field === "usageLimit" || field === "usageLimitPerCustomer") {
      const numValue = value === "" ? "" : Number(value);
      setFormData((prev) => ({ ...prev, [field]: numValue }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
  };

  const generateCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 8; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
    handleChange("code", result);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      discountValue: Number(formData.discountValue),
      minSubtotal: formData.minSubtotal ? Number(formData.minSubtotal) : undefined,
      maxDiscount: formData.maxDiscount ? Number(formData.maxDiscount) : undefined,
      usageLimit: formData.usageLimit ? Number(formData.usageLimit) : undefined,
      usageLimitPerCustomer: formData.usageLimitPerCustomer ? Number(formData.usageLimitPerCustomer) : undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onCancel}>
      <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-neutral-100 sticky top-0 bg-white z-10">
          <h3 className="text-lg font-semibold text-neutral-900">{coupon ? "Edit Offer" : "New Offer"}</h3>
          <button onClick={onCancel}><X size={20} className="text-neutral-400 hover:text-neutral-600" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {/* Spend & Save Toggle */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <Zap className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
            <div className="flex-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isAutoApply}
                  onChange={(e) => handleChange("isAutoApply", e.target.checked)}
                  className="w-4 h-4 accent-[#E3A008] rounded"
                />
                <span className="text-sm font-semibold text-amber-900">Make this a "Spend & Save" Offer (Auto-Apply)</span>
              </label>
              <p className="text-xs text-amber-700 mt-1 ml-6">
                Customers won&apos;t need to enter a code. The discount will apply automatically at checkout when they meet the minimum order amount.
              </p>
            </div>
          </div>

          {/* Code (Only show if NOT auto-apply) */}
          {!formData.isAutoApply && (
            <div>
              <label className="block text-sm font-medium text-[#17181C] mb-1.5">Coupon Code *</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    required
                    value={formData.code}
                    onChange={(e) => handleChange("code", e.target.value.toUpperCase())}
                    placeholder="e.g. SUMMER20"
                    className="w-full bg-white border border-[#E8E7E2] rounded-xl pl-10 pr-3 py-2.5 text-sm font-mono font-medium uppercase focus:outline-none focus:ring-2 focus:ring-[#E3A008]/40 focus:border-[#E3A008]"
                  />
                </div>
                <button type="button" onClick={generateCode} className="px-4 py-2 text-sm font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-xl transition-colors">
                  Generate
                </button>
              </div>
            </div>
          )}

          {/* Discount Type & Value */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#17181C] mb-1.5">Discount Type *</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleChange("discountType", "PERCENTAGE")}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                    formData.discountType === "PERCENTAGE" ? "bg-purple-50 border-purple-200 text-purple-700" : "bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                  }`}
                >
                  <Percent size={16} /> Percentage
                </button>
                <button
                  type="button"
                  onClick={() => handleChange("discountType", "FLAT")}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                    formData.discountType === "FLAT" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                  }`}
                >
                  <Banknote size={16} /> Flat Amount
                </button>
              </div>
            </div>
            <FormField
              label={`Discount ${formData.discountType === "PERCENTAGE" ? "(%)" : `(${currency})`} *`}
              type="number"
              min="0"
              required
              value={formData.discountValue}
              onChange={(e) => handleChange("discountValue", e.target.value)}
              placeholder={formData.discountType === "PERCENTAGE" ? "e.g. 20" : "e.g. 500"}
            />
          </div>

          {/* Advanced Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {formData.discountType === "PERCENTAGE" && (
              <FormField
                label={`Max Discount Cap (${currency})`}
                type="number"
                min="0"
                value={formData.maxDiscount}
                onChange={(e) => handleChange("maxDiscount", e.target.value)}
                placeholder="e.g. 1000"
              />
            )}
            <FormField
              label={`Min. Order Amount (${currency}) ${formData.isAutoApply ? "*" : ""}`}
              type="number"
              min="0"
              required={formData.isAutoApply}
              value={formData.minSubtotal}
              onChange={(e) => handleChange("minSubtotal", e.target.value)}
              placeholder="e.g. 500"
            />
          </div>

          {/* Usage Limits */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="Total Usage Limit"
              type="number"
              min="1"
              value={formData.usageLimit}
              onChange={(e) => handleChange("usageLimit", e.target.value)}
              placeholder="Leave blank for unlimited"
            />
            <FormField
              label="Limit Per Customer"
              type="number"
              min="1"
              value={formData.usageLimitPerCustomer}
              onChange={(e) => handleChange("usageLimitPerCustomer", e.target.value)}
              placeholder="Default: 1"
            />
          </div>

          {/* Validity Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#17181C] mb-1.5">Valid From *</label>
              <div className="relative">
                <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="date"
                  required
                  value={formData.validFrom}
                  onChange={(e) => handleChange("validFrom", e.target.value)}
                  className="w-full bg-white border border-[#E8E7E2] rounded-xl pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E3A008]/40 focus:border-[#E3A008]"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#17181C] mb-1.5">Expires On</label>
              <div className="relative">
                <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="date"
                  value={formData.expiresAt}
                  onChange={(e) => handleChange("expiresAt", e.target.value)}
                  className="w-full bg-white border border-[#E8E7E2] rounded-xl pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E3A008]/40 focus:border-[#E3A008]"
                />
              </div>
              <p className="text-xs text-neutral-400 mt-1">Leave blank for no expiry</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t border-neutral-100">
            <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || (!formData.isAutoApply && !formData.code) || !formData.discountValue}
              className="px-6 py-2 text-sm font-medium bg-[#1B2333] text-white rounded-lg hover:bg-[#1B2333]/90 disabled:opacity-50 transition-colors"
            >
              {isLoading ? "Saving..." : coupon ? "Update Offer" : "Create Offer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}