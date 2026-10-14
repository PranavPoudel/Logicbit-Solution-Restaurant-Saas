// components/account/favorites-tab.tsx
"use client";

import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import { favoritesApi } from "@/lib/api/customers";

interface FavoriteRow {
  id: string;
  restaurantId: string;
  restaurant?: { slug?: string; name?: string; city?: string };
}

export function FavoritesTab() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["my-favorites"],
    queryFn: () => favoritesApi.list() as Promise<FavoriteRow[]>,
  });

  const removeMutation = useMutation({
    mutationFn: (restaurantId: string) => favoritesApi.remove(restaurantId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["my-favorites"] }),
  });

  const favorites = data ?? [];

  return (
    <div className="animate-fade-up max-w-3xl pb-5 space-y-3">
      {isLoading ? (
        <p className="text-sm text-neutral-400">Loading favorites…</p>
      ) : favorites.length === 0 ? (
        <p className="text-sm text-neutral-400">No favorite restaurants yet.</p>
      ) : (
        favorites.map((fav) => (
          <div
            key={fav.id}
            className="flex items-center justify-between bg-white border border-[#E8E7E2] rounded-xl p-4 md:p-5"
          >
            <Link href={`/restaurants/${fav.restaurant?.slug ?? fav.restaurantId}`} className="text-base font-medium text-[#17181C]">
              {fav.restaurant?.name ?? "Restaurant"}
              {fav.restaurant?.city && <span className="block text-sm font-normal text-neutral-400">{fav.restaurant.city}</span>}
            </Link>
            <button
              onClick={() => removeMutation.mutate(fav.restaurantId)}
              aria-label="Remove from favorites"
            >
              <Heart size={16} className="fill-red-500 text-red-500" />
            </button>
          </div>
        ))
      )}
    </div>
  );
}
