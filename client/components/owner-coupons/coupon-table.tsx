"use client";

import { Edit2, Trash2, Tag, Percent } from "lucide-react";

export interface OwnerCoupon {
  id: string;
  code: string;
  discountType: "PERCENTAGE" | "FLAT";
  discountValue: number;
  minSubtotal?: number;
  maxDiscount?: number;
  validFrom?: string;
  expiresAt?: string;
  usageLimit?: number;
  usageLimitPerCustomer?: number;
  usedCount?: number;
  isActive: boolean;
}

interface CouponTableProps {
  coupons: OwnerCoupon[];
  onEdit: (coupon: OwnerCoupon) => void;
  onDelete: (id: string) => void;
  isLoading?: boolean;
}

export function CouponTable({ coupons, onEdit, onDelete, isLoading }: CouponTableProps) {
  const formatDiscount = (coupon: OwnerCoupon) => {
    if (coupon.discountType === "PERCENTAGE") {
      return `${coupon.discountValue}%`;
    }
    return `NPR ${coupon.discountValue}`;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const isExpired = (coupon: OwnerCoupon) => {
    if (!coupon.expiresAt) return false;
    return new Date(coupon.expiresAt) < new Date();
  };

  return (
    <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-neutral-50 border-b border-neutral-200">
            <tr>
              <th className="text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider px-4 py-3">
                Code
              </th>
              <th className="text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider px-4 py-3">
                Discount
              </th>
              <th className="text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider px-4 py-3">
                Min Order
              </th>
              <th className="text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider px-4 py-3">
                Validity
              </th>
              <th className="text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider px-4 py-3">
                Usage
              </th>
              <th className="text-right text-xs font-semibold text-neutral-600 uppercase tracking-wider px-4 py-3">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {coupons.map((coupon) => {
              const expired = isExpired(coupon);
              return (
                <tr key={coupon.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Tag size={16} className="text-neutral-400" />
                      <span className="font-mono text-sm font-medium text-neutral-900">
                        {coupon.code}
                      </span>
                      {expired && (
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                          Expired
                        </span>
                      )}
                      {!coupon.isActive && !expired && (
                        <span className="px-2 py-0.5 bg-neutral-100 text-neutral-600 text-xs font-medium rounded-full">
                          Inactive
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {coupon.discountType === "PERCENTAGE" ? (
                        <Percent size={16} className="text-[#E3A008]" />
                      ) : (
                        <span className="text-xs text-neutral-400">NPR</span>
                      )}
                      <span className="text-sm font-medium text-neutral-900">
                        {formatDiscount(coupon)}
                      </span>
                      {coupon.maxDiscount && (
                        <span className="text-xs text-neutral-500">
                          (max {formatDiscount({ ...coupon, discountValue: coupon.maxDiscount! })})
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-neutral-600">
                      {coupon.minSubtotal ? `NPR ${coupon.minSubtotal}` : "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm">
                      <div className="text-neutral-900">
                        {formatDate(coupon.validFrom)} - {formatDate(coupon.expiresAt)}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-neutral-600">
                      {coupon.usedCount || 0} / {coupon.usageLimit || "∞"}
                      {coupon.usageLimitPerCustomer && (
                        <div className="text-xs text-neutral-400">
                          ({coupon.usageLimitPerCustomer} per customer)
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onEdit(coupon)}
                        className="p-2 text-neutral-600 hover:text-[#E3A008] hover:bg-[#E3A008]/10 rounded-lg transition-colors"
                        title="Edit coupon"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => onDelete(coupon.id)}
                        disabled={isLoading}
                        className="p-2 text-neutral-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Delete coupon"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}