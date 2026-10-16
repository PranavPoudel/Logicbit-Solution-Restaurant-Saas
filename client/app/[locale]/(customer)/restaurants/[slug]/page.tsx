// app/%5Blocale%5D/%28customer%29/restaurants/%5Bslug%5D/page.tsx
"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { RestaurantHeader } from "@/components/menu/restaurant-header";
import { MenuSection } from "@/components/menu/menu-section";
import { ModifierModal } from "@/components/menu-modal/modifier-modal";
import { StorefrontBannerCarousel } from "@/components/restaurant/storefront-banner-carousel";
import { StorefrontOffersSection } from "@/components/restaurant/storefront-offers-section";
import { StorefrontAboutSection } from "@/components/restaurant/storefront-about-section";
import { StorefrontContactSection } from "@/components/restaurant/storefront-contact-section";
import { StorefrontReviewsSection } from "@/components/restaurant/storefront-reviews-section";
import { SimilarRestaurants } from "@/components/restaurant/similar-restaurants";
import { StorefrontPopupModal } from "@/components/restaurant/storefront-popup-modal";
import {
  getNearbyRestaurants,
  getRestaurantByIdOrSlug,
  getRestaurantMenu,
  getRestaurantStorefront,
  getRestaurantStorefrontPopup,
  type SectionSetting,
} from "@/lib/api/discovery";
import { restaurantAccentStyle } from "@/lib/utils/restaurant-theme";
import { useGeolocation } from "@/hooks/use-geolocation";

const DEFAULT_SECTIONS: SectionSetting[] = ["banner", "contact", "menu", "about", "reviews"].map((id) => ({ id, isVisible: true, titleEn: "", titleJa: "" }));

export default function RestaurantDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const t = useTranslations("restaurant");
  const locale = useLocale();
  const { slug } = use(params);
  const { lat, lng, isResolved } = useGeolocation();
  const linkedItem = useSearchParams().get("item");
  const [modifierItemId, setModifierItemId] = useState<string | null>(linkedItem);

  const restaurantQuery = useQuery({
    queryKey: ["restaurant", slug],
    queryFn: () => getRestaurantByIdOrSlug(slug),
  });
  const restaurant = restaurantQuery.data;
  const restaurantId = restaurant?.id;

  const menuQuery = useQuery({
    queryKey: ["restaurant-menu", restaurantId],
    queryFn: () => getRestaurantMenu(restaurantId as string),
    enabled: !!restaurantId,
  });
  const storefrontQuery = useQuery({
    queryKey: ["storefront", restaurantId],
    queryFn: () => getRestaurantStorefront(restaurantId as string),
    enabled: !!restaurantId,
  });
  const popupQuery = useQuery({
    queryKey: ["storefront-popup", restaurantId],
    queryFn: () => getRestaurantStorefrontPopup(restaurantId as string),
    enabled: !!restaurantId,
  });
  const nearbyQuery = useQuery({
    queryKey: ["nearby-restaurants", lat, lng, "similar"],
    queryFn: () => getNearbyRestaurants({ lat, lng, radiusKm: 50, limit: 12 }),
    enabled: isResolved,
  });

  const categories = menuQuery.data ?? [];
  const storefront = storefrontQuery.data;
  const sections = (storefront?.sectionSettings?.length ? storefront.sectionSettings : DEFAULT_SECTIONS).filter((s) => s.isVisible);
  const has = (id: string) => sections.some((s) => s.id === id);
  const titleOf = (id: string, fallback: string) => {
    const s = sections.find((x) => x.id === id);
    return (locale === "ja" ? s?.titleJa : s?.titleEn) || s?.titleEn || fallback;
  };
  const banners = storefront?.banners ?? [];

  const similar = useMemo(() => (nearbyQuery.data?.data ?? []).filter((r) => r.id !== restaurantId).slice(0, 3), [nearbyQuery.data, restaurantId]);

  if (restaurantQuery.isLoading) {
    return (
      <div className="mx-auto w-full max-w-[1440px] px-5 py-16 md:px-10" aria-busy="true">
        <div className="h-[200px] animate-pulse rounded-[32px] bg-ink/10 md:h-[280px]" />
        <div className="mt-16 h-12 w-1/2 animate-pulse rounded-2xl bg-ink/10" />
      </div>
    );
  }

  if (restaurantQuery.isError || !restaurant) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-4 px-5 py-20 text-center" role="alert">
        <h1 className="font-display text-4xl font-extrabold">{t("notFoundTitle")}</h1>
        <p className="text-lg text-ink/75">{t("notFoundBody")}</p>
        <Link href="/restaurants" className="inline-flex min-h-12 items-center rounded-full bg-chili px-6 font-bold text-parchment">{t("browseKitchens")}</Link>
      </div>
    );
  }

  const extra = (id: string) => {
    switch (id) {
      case "offers":
        return <StorefrontOffersSection title={titleOf("offers", t("sectionOffers"))} restaurantId={restaurant.id} />;
      case "about":
        return <StorefrontAboutSection title={titleOf("about", t("sectionAbout"))} aboutText={storefront?.about} />;
      case "contact":
        return (
          <StorefrontContactSection
            title={titleOf("contact", t("sectionContact"))}
            name={restaurant.name}
            contact={storefront?.contact}
            socialLinks={storefront?.socialLinks}
            latitude={restaurant.latitude}
            longitude={restaurant.longitude}
          />
        );
      case "reviews":
        return <StorefrontReviewsSection title={titleOf("reviews", t("sectionReviews"))} restaurantId={restaurant.id} rating={restaurant.avgRating} total={restaurant.totalReviews} />;
      default:
        return null;
    }
  };

  const extras = sections.filter((s) => ["offers", "about", "contact", "reviews"].includes(s.id));

  return (
    <div style={restaurantAccentStyle(restaurant)} className="pb-28 lg:pb-16">
      <RestaurantHeader restaurant={restaurant} />

      {has("banner") && banners.length > 0 && (
        <div className="mx-auto mt-8 w-full max-w-[1440px] px-5 md:px-10">
          <StorefrontBannerCarousel banners={banners} />
        </div>
      )}

      {has("menu") && <MenuSection categories={categories} onOpenModifiers={setModifierItemId} />}
      {has("menu") && menuQuery.isLoading && <p className="mx-auto mt-10 w-full max-w-[1440px] px-5 text-lg text-ink/70 md:px-10">{t("loadingMenu")}</p>}
      {has("menu") && !menuQuery.isLoading && categories.length === 0 && (
        <p className="mx-auto mt-10 w-full max-w-[1440px] px-5 text-lg text-ink/70 md:px-10">{t("noMenu")}</p>
      )}

      {extras.map((s) => (
        <div key={s.id} className="mx-auto w-full max-w-[1440px] px-0 pt-10 md:px-0">
          {extra(s.id)}
        </div>
      ))}

      <SimilarRestaurants restaurants={similar} loading={nearbyQuery.isLoading || !isResolved} error={nearbyQuery.isError} onRetry={() => nearbyQuery.refetch()} />

      {modifierItemId && <ModifierModal restaurantId={restaurant.id} menuItemId={modifierItemId} onClose={() => setModifierItemId(null)} />}

      <StorefrontPopupModal popups={popupQuery.data ? [popupQuery.data] : []} />
    </div>
  );
}
