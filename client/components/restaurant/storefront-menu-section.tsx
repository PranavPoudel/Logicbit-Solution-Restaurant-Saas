// components/restaurant/storefront-menu-section.tsx
"use client";

import { CategoryNav } from "@/components/menu/category-nav";
import { MenuItemCard } from "@/components/menu/menu-item-card";
import { useState } from "react";

interface StorefrontMenuSectionProps {
  title: string;
  restaurantId: string;
  categories: any[];
  onOpenModifiers?: (itemId: string) => void;
}

export function StorefrontMenuSection({
  title,
  restaurantId,
  categories,
  onOpenModifiers,
}: StorefrontMenuSectionProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const activeCategoryId = selectedCategoryId ?? categories[0]?.id ?? null;

  function scrollToCategory(id: string) {
    setSelectedCategoryId(id);
    document.getElementById(`category-${id}`)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  if (categories.length === 0) return null;

  return (
    <div className="max-w-4xl mx-auto px-4">
      <h2 className="font-display text-2xl font-bold text-[#2B1410] mb-6">{title}</h2>

      <CategoryNav
        categories={categories}
        activeId={activeCategoryId}
        onSelect={scrollToCategory}
      />

      <div className="space-y-8 mt-6">
        {categories.map((category) => (
          <div key={category.id} id={`category-${category.id}`} className="scroll-mt-32">
            <h3 className="font-serif font-semibold text-lg text-[#2B1410] mb-4">
              {category.name ?? "Menu"}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {(category.items ?? []).map((item: any) => (
                <MenuItemCard
                  key={item.id}
                  item={item}
                  restaurantId={restaurantId}
                  onOpenModifiers={onOpenModifiers ?? (() => {})}
                />
              ))}
            </div>
            {(category.items ?? []).length === 0 && (
              <p className="text-xs text-[#2B1410]/40 py-3">No items in this category.</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}