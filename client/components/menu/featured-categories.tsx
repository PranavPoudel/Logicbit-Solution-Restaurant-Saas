// components/menu/featured-categories.tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import { getFeaturedCategories } from "@/lib/api/discovery";
import { theme } from "@/config/theme";

interface FeaturedCategoriesProps {
  restaurantId: string;
  onSelect: (categoryId: string) => void;
}

export function FeaturedCategories({ restaurantId, onSelect }: FeaturedCategoriesProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["featured-categories", restaurantId],
    queryFn: () => getFeaturedCategories(restaurantId),
    enabled: !!restaurantId,
  });

  const categories = Array.isArray(data) ? data : data?.categories ?? [];

  if (isLoading || categories.length === 0) return null;

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 mb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      {categories.map((cat: any) => (
        <button
          key={cat.id}
          onClick={() => onSelect(cat.id)}
          className="shrink-0 text-xs font-medium px-3.5 py-2 rounded-full transition-colors"
          style={{
            backgroundColor: `${theme.colors.primary}14`,
            color: theme.colors.primary,
          }}
        >
          {cat.name}
        </button>
      ))}
    </div>
  );
}