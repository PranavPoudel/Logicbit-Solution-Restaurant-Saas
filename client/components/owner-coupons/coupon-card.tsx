// components/owner-coupons/coupon-card.tsx
"use client";

import { Pencil, Trash2, RotateCcw, X, Tag, Calendar, Users, Zap } from "lucide-react";
import { useMoney } from "@/hooks/use-money";

export interface OwnerCoupon {
  id: string;
  code?: string; // 🆕 Made optional
  discountType: "PERCENTAGE" | "FLAT";
  discountValue: number;
  minSubtotal?: number;
  maxDiscount?: number;
  usageLimit?: number;
  usageLimitPerCustomer?: number;
  usedCount: number;
  validFrom?: string;
  expiresAt?: string;
  isActive: boolean;
  isAutoApply?: boolean; // 🆕 Added
  deletedAt?: string;
}
interface CouponCardProps {
  coupon: OwnerCoupon;
  isTrash: boolean;
  onEdit: (coupon: OwnerCoupon) => void;
  onDelete: () => void;
  onRestore: () => void;
  onPermDelete: () => void;
  isLoading: boolean;
}

export function CouponCard({ coupon, isTrash, onEdit, onDelete, onRestore, onPermDelete, isLoading }: CouponCardProps) {
  const money = useMoney();
  const isExpired = coupon.expiresAt ? new Date(coupon.expiresAt) < new Date() : false;
  const usageText = coupon.usageLimit ? `${coupon.usedCount} / ${coupon.usageLimit} used` : `${coupon.usedCount} used`;
  const discountText = coupon.discountType === "PERCENTAGE" ? `${coupon.discountValue}% OFF` : `${money(coupon.discountValue)} OFF`;

  return (
    <div className={`bg-white border rounded-xl p-5 transition-shadow hover:shadow-sm ${isExpired ? 'border-neutral-200 opacity-75' : 'border-neutral-200'}`}>
         <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${coupon.discountType === 'PERCENTAGE' ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'}`}>
            {coupon.isAutoApply ? <Zap size={18} /> : <Tag size={18} />}
          </div>
          <div>
            <h3 className="text-base font-bold text-neutral-900 font-mono tracking-wide">
              {coupon.isAutoApply ? "AUTO-APPLY" : (coupon.code || "NO CODE")}
            </h3>
            <p className="text-sm font-semibold text-neutral-700">{discountText}</p>
          </div>
        </div>
        {isExpired && !isTrash && (
          <span className="text-[10px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full">EXPIRED</span>
        )}
      </div>

      <div className="space-y-2 mb-4">
        {coupon.minSubtotal ? (
          <p className="text-xs text-neutral-500 flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-neutral-400" /> Min. order: {money(coupon.minSubtotal)}
          </p>
        ) : null}
        {coupon.maxDiscount && coupon.discountType === "PERCENTAGE" ? (
          <p className="text-xs text-neutral-500 flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-neutral-400" /> Max discount: {money(coupon.maxDiscount)}
          </p>
        ) : null}
        <p className="text-xs text-neutral-500 flex items-center gap-1.5">
          <Users size={12} /> {usageText} {coupon.usageLimitPerCustomer ? `(max ${coupon.usageLimitPerCustomer}/customer)` : ""}
        </p>
        <p className="text-xs text-neutral-500 flex items-center gap-1.5">
          <Calendar size={12} /> Valid until: {coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleDateString() : "No expiry"}
        </p>
      </div>

      <div className="flex items-center justify-end gap-1 pt-3 border-t border-neutral-100">
        {isTrash ? (
          <>
            <button 
              onClick={() => onRestore()} 
              disabled={isLoading} 
              className="flex min-h-11 items-center gap-1.5 px-3 text-xs font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors disabled:opacity-50"
            >
              <RotateCcw size={12} /> Restore
            </button>
            <button 
              onClick={() => onPermDelete()} 
              disabled={isLoading} 
              className="flex min-h-11 items-center gap-1.5 px-3 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
            >
              <X size={12} /> Delete Forever
            </button>
          </>
        ) : (
          <>
            <button 
              onClick={() => onEdit(coupon)} 
              className="grid h-11 w-11 place-items-center text-neutral-400 hover:text-[#E3A008] hover:bg-amber-50 rounded-lg transition-colors" 
              title="Edit coupon"
              aria-label="Edit coupon"
            >
              <Pencil size={14} />
            </button>
            <button 
              onClick={() => onDelete()} 
              className="grid h-11 w-11 place-items-center text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" 
              title="Delete coupon"
              aria-label="Delete coupon"
            >
              <Trash2 size={14} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}