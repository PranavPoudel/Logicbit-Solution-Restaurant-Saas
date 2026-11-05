// hooks/use-favorite.ts
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { favoritesApi } from "@/lib/api/customers";
import { useCustomerAuthStore } from "@/store/customer-auth-store";
import { useRequireLogin } from "@/hooks/use-require-login";

export function useFavorite(restaurantId: string) {
  const queryClient = useQueryClient();
  const requireLogin = useRequireLogin();
  const isAuthenticated = useCustomerAuthStore((s) => s.isAuthenticated);
  const { data: favorites } = useQuery({
    queryKey: ["my-favorites"],
    queryFn: () => favoritesApi.list() as Promise<{ restaurantId: string }[]>,
    enabled: isAuthenticated,
  });
  const fav = !!favorites?.some((f) => f.restaurantId === restaurantId);
  const mutation = useMutation({
    mutationFn: () => (fav ? favoritesApi.remove(restaurantId) : favoritesApi.add(restaurantId)),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["my-favorites"] }),
  });
  return { fav, toggle: () => requireLogin() && mutation.mutate() };
}
