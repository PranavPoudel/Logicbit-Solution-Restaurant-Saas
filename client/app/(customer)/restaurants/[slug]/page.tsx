"use client";

import { use, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import { RestaurantHeader } from "@/components/menu/restaurant-header";
import { CategoryNav } from "@/components/menu/category-nav";
import { MenuItemCard } from "@/components/menu/menu-item-card";
import { FloatingCartBar } from "@/components/menu/floating-cart-bar";
import { SignatureDishes } from "@/components/menu/signature-dishes";
import { RestaurantFooter } from "@/components/menu/restaurant-footer";
import { DynamicRestaurantLocationMap } from "@/components/map/dynamic-restaurant-location-map";
import { ModifierModal } from "@/components/menu-modal/modifier-modal";
import { getRestaurantByIdOrSlug, getRestaurantMenu } from "@/lib/api/discovery";

import { publicStorefrontApi } from "@/lib/api/public-storefront";
import { StorefrontBannerCarousel } from "@/components/restaurant/storefront-banner-carousel";
import { StorefrontAboutSection } from "@/components/restaurant/storefront-about-section";
import { StorefrontPopupModal } from "@/components/restaurant/storefront-popup-modal";

export default function RestaurantDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);

  // 1. Fetch Restaurant Details
  const restaurantQuery = useQuery({
    queryKey: ["restaurant", slug],
    queryFn: () => getRestaurantByIdOrSlug(slug),
  });

  const restaurantId = restaurantQuery.data?.id;

  // 2. Fetch Menu
  const menuQuery = useQuery({
    queryKey: ["restaurant-menu", restaurantId],
    queryFn: () => getRestaurantMenu(restaurantId as string),
    enabled: !!restaurantId,
  });

    const bannersQuery = useQuery({
    queryKey: ["public-banners", restaurantId],
    queryFn: async () => {
      const data = await publicStorefrontApi.getStorefront(restaurantId as string);
      return data.banners; 
    },
    enabled: !!restaurantId,
  });

    const configQuery = useQuery({
    queryKey: ["public-config", restaurantId],
    queryFn: async () => {
      const data = await publicStorefrontApi.getStorefront(restaurantId as string);
      return data.config;
    },
    enabled: !!restaurantId,
  });

    const popupsQuery = useQuery({
    queryKey: ["public-popups", restaurantId],
    queryFn: async () => {
      const popup = await publicStorefrontApi.getPopup(restaurantId as string);
      return popup ? [popup] : []; 
    },
    enabled: !!restaurantId,
  });

  const categories = menuQuery.data ?? [];
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [modifierItemId, setModifierItemId] = useState<string | null>(null);
  const activeCategoryId = selectedCategoryId ?? categories[0]?.id ?? null;

  function scrollToCategory(id: string) {
    setSelectedCategoryId(id);
    document.getElementById(`category-${id}`)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  if (restaurantQuery.isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-sm text-[#2B1410]/40">
        Loading restaurant…
      </div>
    );
  }

  if (restaurantQuery.isError || !restaurantQuery.data) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 flex flex-col items-center text-center gap-3">
        <AlertTriangle className="text-[#2B1410]/25" size={28} />
        <p className="text-sm text-[#2B1410]/55">
          Couldn&apos;t load this restaurant. It may not exist, or the backend
          isn&apos;t reachable.
        </p>
      </div>
    );
  }

  return (
    <div className="pb-24">
      <RestaurantHeader restaurant={restaurantQuery.data} />

      <div className="max-w-4xl mx-auto px-4">
        <SignatureDishes />
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <StorefrontBannerCarousel banners={bannersQuery.data || []} />
      </div>

      <CategoryNav
        categories={categories}
        activeId={activeCategoryId}
        onSelect={scrollToCategory}
      />

      <div className="max-w-4xl mx-auto px-4 space-y-8">
        {/* Menu Items Section */}
        {menuQuery.isLoading ? (
          <p className="text-sm text-[#2B1410]/40 text-center py-12">Loading menu…</p>
        ) : categories.length === 0 ? (
          <p className="text-sm text-[#2B1410]/40 text-center py-12">
            This restaurant hasn&apos;t added any menu items yet.
          </p>
        ) : (
          categories.map((category) => (
            <div key={category.id} id={`category-${category.id}`} className="scroll-mt-32 py-5">
              <h3 className="font-serif font-semibold text-lg text-[#2B1410] mb-4">
                {category.name ?? "Menu"}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {(category.items ?? []).map((item) => (
                  <MenuItemCard
                    key={item.id}
                    item={item}
                    restaurantId={restaurantQuery.data.id}
                    onOpenModifiers={setModifierItemId}
                  />
                ))}
              </div>
              {(category.items ?? []).length === 0 && (
                <p className="text-xs text-[#2B1410]/40 py-3">No items in this category.</p>
              )}
            </div>
          ))
        )}

        <StorefrontAboutSection config={configQuery.data || {}} />

        <DynamicRestaurantLocationMap
          lat={(restaurantQuery.data as any).latitude}
          lng={(restaurantQuery.data as any).longitude}
          address={(restaurantQuery.data as any).address}
        />
      </div>

      <RestaurantFooter restaurant={restaurantQuery.data} />

      <FloatingCartBar />

      {modifierItemId && (
        <ModifierModal
          restaurantId={restaurantQuery.data.id}
          menuItemId={modifierItemId}
          onClose={() => setModifierItemId(null)}
        />
      )}

      <StorefrontPopupModal popups={popupsQuery.data || []} />
    </div>
  );
}