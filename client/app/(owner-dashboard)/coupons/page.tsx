"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Plus, Edit2, Trash2 } from "lucide-react";
import { useOwnerAuthStore } from "@/store/owner-auth-store";
import { couponsApi } from "@/lib/api/coupons";
import { CouponForm, type CouponFormData } from "@/components/owner-coupons/coupon-form";
import { CouponTable, type OwnerCoupon } from "@/components/owner-coupons/coupon-table";

export default function CouponsPage() {
  const restaurantId = useOwnerAuthStore((s) => s.activeRestaurantId);
  const queryClient = useQueryClient();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<OwnerCoupon | null>(null);

  const couponsQuery = useQuery({
    queryKey: ["owner-coupons", restaurantId],
    queryFn: () => couponsApi.list(restaurantId as string) as Promise<OwnerCoupon[]>,
    enabled: !!restaurantId,
  });

  const createMutation = useMutation({
    mutationFn: (input: CouponFormData) =>
      couponsApi.create(restaurantId as string, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-coupons", restaurantId] });
      setIsFormOpen(false);
      setEditingCoupon(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<CouponFormData> }) =>
      couponsApi.update(restaurantId as string, id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-coupons", restaurantId] });
      setIsFormOpen(false);
      setEditingCoupon(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => couponsApi.remove(restaurantId as string, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-coupons", restaurantId] });
    },
  });

  const handleAdd = () => {
    setEditingCoupon(null);
    setIsFormOpen(true);
  };

  const handleEdit = (coupon: OwnerCoupon) => {
    setEditingCoupon(coupon);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this coupon?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleSubmit = (data: CouponFormData) => {
    if (editingCoupon) {
      updateMutation.mutate({ id: editingCoupon.id, input: data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingCoupon(null);
  };

  if (!restaurantId) {
    return (
      <div className="max-w-6xl mx-auto flex flex-col items-center text-center gap-3 py-16">
        <AlertTriangle className="text-neutral-300" size={28} />
        <p className="text-sm text-neutral-500">
          No restaurant selected. Use the restaurant switcher in the top bar.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">Coupons</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Discount codes customers can apply at checkout.
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2 bg-[#1B2333] text-white text-sm font-medium rounded-lg hover:bg-[#2B2D33] transition-colors"
        >
          <Plus size={16} />
          Add Coupon
        </button>
      </div>

      {couponsQuery.isLoading ? (
        <p className="text-sm text-neutral-400">Loading coupons…</p>
      ) : couponsQuery.data && couponsQuery.data.length > 0 ? (
        <CouponTable
          coupons={couponsQuery.data}
          onEdit={handleEdit}
          onDelete={handleDelete}
          isLoading={deleteMutation.isPending}
        />
      ) : (
        <div className="bg-white border border-neutral-200 rounded-xl p-12 text-center">
          <p className="text-sm text-neutral-500">No coupons yet. Create your first coupon to get started.</p>
        </div>
      )}

      {isFormOpen && (
        <CouponForm
          coupon={editingCoupon}
          onSubmit={handleSubmit}
          onCancel={handleCloseForm}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      )}
    </div>
  );
}