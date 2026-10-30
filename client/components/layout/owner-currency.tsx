"use client";

import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { CurrencyProvider } from "@/hooks/use-money";
import { getMyRestaurant } from "@/lib/api/restaurants";
import { useOwnerAuthStore } from "@/store/owner-auth-store";

export function OwnerCurrency({ children }: { children: ReactNode }) {
  const restaurantId = useOwnerAuthStore((s) => s.activeRestaurantId);
  const stored = useOwnerAuthStore((s) => s.restaurants.find((r) => r.id === s.activeRestaurantId)?.currencyCode);
  const { data } = useQuery({
    queryKey: ["owner-restaurant-currency", restaurantId],
    queryFn: () => getMyRestaurant(restaurantId as string),
    enabled: !!restaurantId,
    staleTime: 5 * 60 * 1000,
    select: (restaurant) => restaurant.currencyCode,
  });
  return <CurrencyProvider code={data ?? stored}>{children}</CurrencyProvider>;
}
