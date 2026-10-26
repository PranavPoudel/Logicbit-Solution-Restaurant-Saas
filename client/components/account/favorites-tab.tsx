// components/account/favorites-tab.tsx
"use client";

import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { favoritesApi } from "@/lib/api/customers";
import { Icon, IconButton } from "@/components/ui/primitives";
import { Empty } from "@/components/account/empty";

interface FavoriteRow {
  id: string;
  restaurantId: string;
  restaurant?: { slug?: string; name?: string; city?: string };
}

export function FavoritesTab() {
  const t = useTranslations("account");
  const tr = useTranslations("restaurant");
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
    <div className="animate-fade-up max-w-3xl space-y-3 pb-5">
      {isLoading ? (
        <p className="text-lg text-ink/70">{t("loadingFavorites")}</p>
      ) : favorites.length === 0 ? (
        <Empty>{t("noFavorites")}</Empty>
      ) : (
        favorites.map((fav) => (
          <div key={fav.id} className="flex items-center justify-between gap-3 rounded-[24px] bg-paper p-4 shadow-soft md:p-5">
            <Link href={`/restaurants/${fav.restaurant?.slug ?? fav.restaurantId}`} className="min-w-0 font-display text-xl font-extrabold hover:underline">
              {fav.restaurant?.name ?? tr("fallbackName")}
              {fav.restaurant?.city && (
                <span className="flex items-center gap-1.5 font-sans text-base font-normal text-ink/70"><Icon name="pin" className="h-4 w-4" />{fav.restaurant.city}</span>
              )}
            </Link>
            <IconButton icon="heart" label={t("removeFavorite")} onClick={() => removeMutation.mutate(fav.restaurantId)} className="bg-chili/10 text-chili [&_svg]:fill-current" />
          </div>
        ))
      )}
    </div>
  );
}
