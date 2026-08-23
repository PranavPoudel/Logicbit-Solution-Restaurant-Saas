// components/account/favorites-tab.tsx
"use client";

import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import { favoritesApi } from "@/lib/api/customers";

interface FavoriteRestaurant {
  id: string;
  slug?: string;
  name?: string;
}

export function FavoritesTab() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["my-favorites"],
    queryFn: () => favoritesApi.list() as Promise<FavoriteRestaurant[]>,
  });

  const removeMutation = useMutation({
    mutationFn: (restaurantId: string) => favoritesApi.remove(restaurantId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["my-favorites"] }),
  });

  const favorites = data ?? [];

  return (
    <div className="max-w-md py-5 space-y-2.5">
      {isLoading ? (
        <p className="text-sm text-neutral-400">Loading favorites…</p>
      ) : favorites.length === 0 ? (
        <p className="text-sm text-neutral-400">No favorite restaurants yet.</p>
      ) : (
        favorites.map((r) => (
          <div
            key={r.id}
            className="flex items-center justify-between bg-white border border-[#E8E7E2] rounded-xl p-3.5"
          >
            <Link href={`/restaurants/${r.slug ?? r.id}`} className="text-sm font-medium text-[#17181C]">
              {r.name ?? "Restaurant"}
            </Link>
            <button
              onClick={() => removeMutation.mutate(r.id)}
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
