// components/menu/featured-items.tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import { getFeaturedItems } from "@/lib/api/discovery";
import { theme } from "@/config/theme";
import { getItemImage } from "@/lib/utils/image";
import type { MenuItem } from "@/types/menu";
import { AppImage } from "@/components/ui/app-image";

interface FeaturedItemsProps {
  restaurantId: string;
  onSelect: (itemId: string) => void;
}

export function FeaturedItems({ restaurantId, onSelect }: FeaturedItemsProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["featured-items", restaurantId],
    queryFn: () => getFeaturedItems(restaurantId),
    enabled: !!restaurantId,
  });

  const items: MenuItem[] = Array.isArray(data) ? data : data?.items ?? [];

  if (isLoading || items.length === 0) return null;

  return (
    <div className="py-2">
      <h3 className="font-serif font-semibold text-lg mb-3" style={{ color: theme.colors.dark }}>
        Chef&apos;s Picks
      </h3>
      <div className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelect(item.id)}
            className="shrink-0 w-36 text-left rounded-2xl overflow-hidden transition-transform hover:-translate-y-0.5"
            style={{ border: `1px solid ${theme.colors.dark}14`, boxShadow: `0 1px 4px ${theme.colors.dark}0D` }}
          >
            <div
              className="w-36 h-24 overflow-hidden"
              style={{ backgroundColor: `${theme.colors.dark}0D` }}
            >
              {getItemImage(item) ? (
                <AppImage sizes="144px" src={getItemImage(item)} alt={item.name ?? ""} className="w-full h-full object-cover" />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center font-serif text-2xl"
                  style={{ color: `${theme.colors.dark}33` }}
                >
                  {item.name?.charAt(0) ?? "?"}
                </div>
              )}
            </div>
            <div className="p-2.5">
              <p className="text-xs font-medium truncate" style={{ color: theme.colors.dark }}>
                {item.name}
              </p>
              {item.price != null && (
                <p className="text-xs font-mono mt-0.5" style={{ color: theme.colors.primary }}>
                  Rs {item.price}
                </p>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}