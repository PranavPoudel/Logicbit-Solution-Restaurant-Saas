// app/(owner-dashboard)/coupons/page.tsx
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import { useOwnerAuthStore } from "@/store/owner-auth-store";
import { couponsApi } from "@/lib/api/coupons";
import { CouponTable, type OwnerCoupon } from "@/components/owner-coupons/coupon-table";

export default function CouponsPage() {
  const restaurantId = useOwnerAuthStore((s) => s.activeRestaurantId);
  const queryClient = useQueryClient();

  const couponsQuery = useQuery({
    queryKey: ["owner-coupons", restaurantId],
    queryFn: () => couponsApi.list(restaurantId as string) as Promise<OwnerCoupon[]>,
    enabled: !!restaurantId,
  });

  const addMutation = useMutation({
    mutationFn: (input: { code: string; discountType: "PERCENTAGE" | "FLAT"; discountValue: number }) =>
      couponsApi.create(restaurantId as string, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-coupons", restaurantId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => couponsApi.remove(restaurantId as string, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-coupons", restaurantId] });
    },
  });

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
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold text-neutral-900 mb-1">Coupons</h1>
      <p className="text-sm text-neutral-500 mb-6">
        Discount codes customers can apply at checkout.
      </p>

      {couponsQuery.isLoading ? (
        <p className="text-sm text-neutral-400">Loading coupons…</p>
      ) : (
        <CouponTable
          coupons={couponsQuery.data ?? []}
          onAdd={(input) => addMutation.mutate(input)}
          onDelete={(id) => deleteMutation.mutate(id)}
          isAdding={addMutation.isPending}
        />
      )}
    </div>
  );
}
