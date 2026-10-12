// components/restaurant/storefront-menu-section.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { CategoryNav } from "@/components/menu/category-nav";
import { MenuItemCard } from "@/components/menu/menu-item-card";
import { CartSummaryCard } from "@/components/menu/cart-summary-card";
import type { MenuCategory } from "@/types/menu";

interface StorefrontMenuSectionProps {
  title: string;
  categories: MenuCategory[];
  aside?: React.ReactNode;
  onOpenModifiers?: (itemId: string) => void;
}

const sectionId = (id: string) => `menu-category-${id}`;
const PAGE_SIZE = 12;

export function StorefrontMenuSection({ title, categories, aside, onOpenModifiers }: StorefrontMenuSectionProps) {
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const activeId = activeCategoryId ?? categories[0]?.id ?? null;
  const lockUntil = useRef(0);
  const [shown, setShown] = useState<Record<string, number>>({});

  useEffect(() => {
    const visible = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = (entry.target as HTMLElement).dataset.categoryId as string;
          if (entry.isIntersecting) visible.add(id);
          else visible.delete(id);
        }
        if (Date.now() < lockUntil.current) return;
        const first = categories.find((c) => visible.has(c.id));
        if (first) setActiveCategoryId(first.id);
      },
      { rootMargin: "-140px 0px -60% 0px" }
    );
    categories.forEach((c) => {
      const el = document.getElementById(sectionId(c.id));
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [categories]);

  const handleSelect = (id: string) => {
    setActiveCategoryId(id);
    lockUntil.current = Date.now() + 800;
    document.getElementById(sectionId(id))?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (categories.length === 0) return null;

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12">
      <div className="grid lg:grid-cols-[minmax(0,1fr)_420px] lg:grid-rows-[auto_1fr] lg:gap-x-8">
        <h2 className="font-serif text-3xl font-bold text-brand-dark mb-8 text-center lg:col-start-1 lg:row-start-1">
          {title}
        </h2>

        <div className="lg:col-start-1 lg:row-start-2">
          <CategoryNav categories={categories} activeId={activeId} onSelect={handleSelect} />

          {categories.map((category) => {
            const items = category.items ?? [];
            const visibleCount = shown[category.id] ?? PAGE_SIZE;
            const remaining = items.length - visibleCount;
            return (
              <section key={category.id} id={sectionId(category.id)} data-category-id={category.id} className="scroll-mt-[130px] pb-6">
                <h3 className="font-serif font-semibold text-lg text-brand-dark mb-4 mt-6">
                  {category.name ?? "Menu"}
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                  {items.slice(0, visibleCount).map((item) => (
                    <MenuItemCard key={item.id} item={item} onOpenModifiers={onOpenModifiers ?? (() => {})} />
                  ))}
                </div>
                {items.length === 0 && <p className="text-xs text-brand-dark/40 py-3">No items in this category.</p>}
                {remaining > 0 && (
                  <button
                    type="button"
                    onClick={() => setShown((s) => ({ ...s, [category.id]: visibleCount + PAGE_SIZE }))}
                    className="mt-4 w-full rounded-xl border border-[#E8E7E2] bg-white py-3 text-sm font-medium text-brand-dark transition-colors hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E3A008]"
                  >
                    Show more ({remaining} more in {category.name ?? "this category"})
                  </button>
                )}
              </section>
            );
          })}
        </div>

        <aside className="mt-8 lg:mt-0 lg:col-start-2 lg:row-start-1 lg:row-span-2 space-y-4">
          <div className="hidden lg:block empty:hidden">
            <CartSummaryCard />
          </div>
          {aside}
        </aside>
      </div>
    </div>
  );
}
