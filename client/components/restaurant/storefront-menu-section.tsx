// components/restaurant/storefront-menu-section.tsx
"use client";

import { CategoryNav } from "@/components/menu/category-nav";
import { MenuItemCard } from "@/components/menu/menu-item-card";
import { CartSummaryCard } from "@/components/menu/cart-summary-card";
import { useState } from "react";
import type { MenuCategory } from "@/types/menu";

interface StorefrontMenuSectionProps {
  title: string;
  categories: MenuCategory[];
  restaurantId: string;
  aside?: React.ReactNode;
  onOpenModifiers?: (itemId: string) => void; 
}
export function StorefrontMenuSection({ title, categories, restaurantId, aside, onOpenModifiers }: StorefrontMenuSectionProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const activeCategoryId = selectedCategoryId ?? categories[0]?.id ?? null;

  const activeCategory = categories.find((c) => c.id === activeCategoryId) ?? categories[0];

  if (categories.length === 0) return null;

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12">
      <div className="grid lg:grid-cols-[minmax(0,1fr)_420px] lg:grid-rows-[auto_auto_1fr] lg:gap-x-8">
        <h2 className="font-serif text-3xl font-bold text-brand-dark mb-8 text-center lg:col-start-1 lg:row-start-1">
          {title}
        </h2>

        <CategoryNav
          categories={categories}
          activeId={activeCategoryId}
          onSelect={setSelectedCategoryId}
          className="self-start lg:col-start-1 lg:row-start-2"
        />

        <div key={activeCategory.id} className="mt-1 lg:col-start-1 lg:row-start-3">
          <h3 className="animate-fade-up font-serif font-semibold text-lg text-brand-dark mb-4 mt-6">
            {activeCategory.name ?? "Menu"}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
            {(activeCategory.items ?? []).map((item, i) => (
              <div
                key={item.id}
                className="animate-fade-up"
                style={{ animationDelay: `${Math.min(i, 8) * 60}ms` }}
              >
                <MenuItemCard
                  item={item}
                  restaurantId={restaurantId}
                  onOpenModifiers={onOpenModifiers ?? (() => {})}
                />
              </div>
            ))}
          </div>
          {(activeCategory.items ?? []).length === 0 && (
            <p className="text-xs text-brand-dark/40 py-3">No items in this category.</p>
          )}
        </div>

        <aside className="mt-8 lg:mt-0 lg:col-start-2 lg:row-start-1 lg:row-span-3 space-y-4">
          <div className="hidden lg:block empty:hidden">
            <CartSummaryCard />
          </div>
          {aside}
        </aside>
      </div>
    </div>
  );
}
