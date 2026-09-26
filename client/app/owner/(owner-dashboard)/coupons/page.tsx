// app/(owner-dashboard)/coupons/page.tsx
"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Plus, Trash2 } from "lucide-react";
import { useOwnerAuthStore } from "@/store/owner-auth-store";
import { couponsApi, type CouponInput } from "@/lib/api/coupons";
import { CouponCard, type OwnerCoupon } from "@/components/owner-coupons/coupon-card";
import { CouponForm, type CouponFormData } from "@/components/owner-coupons/coupon-form";

const TABS = [
  { key: "ACTIVE", label: "Active Coupons" },
  { key: "TRASH", label: "Trash", icon: Trash2 },
];

export default function CouponsPage() {
  const restaurantId = useOwnerAuthStore((s) => s.activeRestaurantId);
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState("ACTIVE");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<OwnerCoupon | null>(null);

  const couponsQuery = useQuery({
    queryKey: ["owner-coupons", restaurantId, activeTab],
    queryFn: () => couponsApi.list(restaurantId as string, activeTab === "TRASH") as Promise<OwnerCoupon[]>,
    enabled: !!restaurantId,
  });

  const saveMutation = useMutation({
    mutationFn: (payload: { id?: string; input: CouponInput }) =>
      payload.id
        ? couponsApi.update(restaurantId as string, payload.id, payload.input)
        : couponsApi.create(restaurantId as string, payload.input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-coupons", restaurantId] });
      setIsFormOpen(false);
      setEditingCoupon(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => couponsApi.remove(restaurantId as string, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["owner-coupons", restaurantId] }),
  });

  const restoreMutation = useMutation({
    mutationFn: (id: string) => couponsApi.restore(restaurantId as string, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["owner-coupons", restaurantId] }),
  });

  const permDeleteMutation = useMutation({
    mutationFn: (id: string) => couponsApi.permanentDelete(restaurantId as string, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["owner-coupons", restaurantId] }),
  });

  const handleAdd = () => {
    setEditingCoupon(null);
    setIsFormOpen(true);
  };

  const handleEdit = (coupon: OwnerCoupon) => {
    setEditingCoupon(coupon);
    setIsFormOpen(true);
  };

  const handleSubmit = (data: CouponFormData) => {
    // Ensure types align perfectly with CouponInput
    const apiInput: CouponInput = {
      code: data.code,
      discountType: data.discountType,
      discountValue: Number(data.discountValue),
      minSubtotal: data.minSubtotal ? Number(data.minSubtotal) : undefined,
      maxDiscount: data.maxDiscount ? Number(data.maxDiscount) : undefined,
      usageLimit: data.usageLimit ? Number(data.usageLimit) : undefined,
      usageLimitPerCustomer: data.usageLimitPerCustomer ? Number(data.usageLimitPerCustomer) : undefined,
      validFrom: data.validFrom,
      expiresAt: data.expiresAt || undefined,
    };

    saveMutation.mutate({ 
      id: editingCoupon?.id, 
      input: apiInput 
    });
  };

  if (!restaurantId) {
    return (
      <div className="max-w-6xl mx-auto flex flex-col items-center text-center gap-3 py-16">
        <AlertTriangle className="text-neutral-300" size={28} />
        <p className="text-sm text-neutral-500">No restaurant selected. Use the restaurant switcher in the top bar.</p>
      </div>
    );
  }

  // Filter active vs expired for the ACTIVE tab
  const displayedCoupons = useMemo(() => {
    const all = couponsQuery.data ?? [];
    if (activeTab === "TRASH") return all;
    
    const now = new Date();
    return all.filter(c => !c.deletedAt && (!c.expiresAt || new Date(c.expiresAt) >= now));
  }, [couponsQuery.data, activeTab]);

  return (
    <div className="max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">Coupons</h1>
          <p className="text-sm text-neutral-500 mt-1">Create and manage discount codes for your customers.</p>
        </div>
        {activeTab === "ACTIVE" && (
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 px-4 py-2 bg-[#E3A008] hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Plus size={16} /> Add Coupon
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-neutral-200 mb-6 overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`shrink-0 flex items-center gap-2 text-sm font-medium px-4 py-2.5 border-b-2 transition-all ${
                activeTab === tab.key
                  ? "border-[#E3A008] text-neutral-900"
                  : "border-transparent text-neutral-500 hover:text-neutral-700"
              }`}
            >
              {Icon && <Icon size={16} className={tab.key === "TRASH" ? "text-red-500" : ""} />}
              {tab.label}
            </button>
          );
        })}
      </div>

      {couponsQuery.isLoading ? (
        <p className="text-sm text-neutral-400 py-8 text-center">Loading coupons…</p>
      ) : displayedCoupons.length === 0 ? (
        <div className="bg-white border border-neutral-200 rounded-xl p-12 text-center">
          <p className="text-sm text-neutral-500">
            {activeTab === "TRASH" ? "Trash is empty." : "No active coupons yet. Create your first coupon to get started."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedCoupons.map((coupon) => (
            <CouponCard
              key={coupon.id}
              coupon={coupon}
              isTrash={activeTab === "TRASH"}
              onEdit={handleEdit}
              onDelete={() => deleteMutation.mutate(coupon.id)}
              onRestore={() => restoreMutation.mutate(coupon.id)}
              onPermDelete={() => permDeleteMutation.mutate(coupon.id)}
              isLoading={deleteMutation.isPending || restoreMutation.isPending || permDeleteMutation.isPending}
            />
          ))}
        </div>
      )}

      {isFormOpen && (
        <CouponForm
          coupon={editingCoupon}
          onSubmit={handleSubmit}
          onCancel={() => { setIsFormOpen(false); setEditingCoupon(null); }}
          isLoading={saveMutation.isPending}
        />
      )}
    </div>
  );
}