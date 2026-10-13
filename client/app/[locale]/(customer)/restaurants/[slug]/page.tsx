// app/%5Blocale%5D/%28customer%29/restaurants/%5Bslug%5D/page.tsx
"use client";

import { use, useState } from "react";
import { useLocale } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import { RestaurantHeader } from "@/components/menu/restaurant-header";
import { FloatingCartBar } from "@/components/menu/floating-cart-bar";
import { ModifierModal } from "@/components/menu-modal/modifier-modal";
import {
  getRestaurantByIdOrSlug,
  getRestaurantMenu,
  getRestaurantStorefront,
  getRestaurantStorefrontPopup,
} from "@/lib/api/discovery";
import { StorefrontSectionRenderer } from "@/components/restaurant/storefront-section-renderer";
import { StorefrontPopupModal } from "@/components/restaurant/storefront-popup-modal";
import { getRestaurantThemeStyle } from "@/lib/utils/restaurant-theme";

export default function RestaurantDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const currentLocale = useLocale();

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

  // 3. Fetch Storefront Data
  const storefrontQuery = useQuery({
    queryKey: ["storefront", restaurantId],
    queryFn: () => getRestaurantStorefront(restaurantId as string),
    enabled: !!restaurantId,
  });

  // 4. Fetch Active Popup
  const popupQuery = useQuery({
    queryKey: ["storefront-popup", restaurantId],
    queryFn: () => getRestaurantStorefrontPopup(restaurantId as string),
    enabled: !!restaurantId,
  });

  const categories = menuQuery.data ?? [];
  const [modifierItemId, setModifierItemId] = useState<string | null>(null);

  const storefrontData = storefrontQuery.data;
  const sectionSettings = storefrontData?.sectionSettings ?? [];
  const banners = storefrontData?.banners ?? [];
  const aboutText = storefrontData?.about;
  const contact = storefrontData?.contact;
  const socialLinks = storefrontData?.socialLinks;

  const hasSidebarCart =
    categories.length > 0 &&
    (sectionSettings.length === 0 || sectionSettings.some((s) => s.id === "menu" && s.isVisible));

  if (restaurantQuery.isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-sm text-neutral-400">
        Loading restaurant…
      </div>
    );
  }

  if (restaurantQuery.isError || !restaurantQuery.data) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 flex flex-col items-center text-center gap-3">
        <AlertTriangle className="text-neutral-300" size={28} />
        <p className="text-sm text-neutral-500">
          Couldn&apos;t load this restaurant. It may not exist, or the backend isn&apos;t reachable.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col" style={getRestaurantThemeStyle(restaurantQuery.data)}>
      <RestaurantHeader restaurant={restaurantQuery.data} />

      {/* Dynamic Storefront Sections (Uses currentLocale for proper i18n) */}
      <StorefrontSectionRenderer
        sectionSettings={sectionSettings}
        restaurantId={restaurantId!}
        locale={currentLocale}
        categories={categories}
        onOpenModifiers={setModifierItemId}
        aboutText={aboutText}
        contact={contact}
        socialLinks={socialLinks}
        banners={banners}
        latitude={restaurantQuery.data.latitude}
        longitude={restaurantQuery.data.longitude}
      />

      {/* Footer & Floating Cart */}
      <FloatingCartBar sidebarCart={hasSidebarCart} />

      {modifierItemId && (
        <ModifierModal
          restaurantId={restaurantQuery.data.id}
          menuItemId={modifierItemId}
          onClose={() => setModifierItemId(null)}
        />
      )}

      <StorefrontPopupModal popups={popupQuery.data ? [popupQuery.data] : []} />
    </div>
  );
}