"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import { HeroSection } from "@/components/home/hero-section";
import { CategoryGrid } from "@/components/home/category-grid";
import { BannerCarousel } from "@/components/home/banner-carousel";
import { FilterBar, QUICK_TAGS, type QuickTag } from "@/components/home/filter-bar";
import { RestaurantCard } from "@/components/restaurant/restaurant-card";
import { RestaurantCardSkeleton } from "@/components/restaurant/restaurant-card-skeleton";
import { PopupAd } from "@/components/home/popup-ad";
import { WhyLogicBit } from "@/components/home/why-logicbit";
import { OwnerBanner } from "@/components/home/owner-banner";
import { getNearbyRestaurants } from "@/lib/api/discovery";
import type { DiscoveryRestaurant } from "@/types/restaurant";
import { listCuisines } from "@/lib/api/cuisines";
import { useGeolocation } from "@/hooks/use-geolocation";

export default function HomePage() {
  const t = useTranslations("home");
  const { lat, lng, isResolved } = useGeolocation();
  const [activeCuisineId, setActiveCuisineId] = useState<string | null>(null);
  const [activeTag, setActiveTag] = useState<QuickTag | null>(null);

  const cuisinesQuery = useQuery({
    queryKey: ["cuisines"],
    queryFn: listCuisines,
  });

  const restaurantsQuery = useQuery({
    queryKey: ["nearby-restaurants", lat, lng, activeCuisineId],
    queryFn: () =>
      getNearbyRestaurants({
        lat,
        lng,
        radiusKm: 10,
        cuisineType: activeCuisineId || undefined,
      }),
    enabled: isResolved,
  });

  const baseRestaurants = useMemo(() => restaurantsQuery.data?.data ?? [], [restaurantsQuery.data]);

  const restaurants = useMemo(() => {
    if (!activeTag) return baseRestaurants;
    const rating = (r: DiscoveryRestaurant) => r.avgRating ?? 0;
    const orders = (r: DiscoveryRestaurant) => r.totalOrders ?? 0;
    const created = (r: DiscoveryRestaurant) => new Date(r.createdAt ?? 0).getTime();
    return [...baseRestaurants].sort((a, b) => {
      if (activeTag === "new") return created(b) - created(a);
      if (activeTag === "trending") return orders(b) - orders(a) || rating(b) - rating(a);
      return rating(b) - rating(a) || orders(b) - orders(a);
    });
  }, [baseRestaurants, activeTag]);

  const activeTagLabel = QUICK_TAGS.find((q) => q.slug === activeTag)?.label;

  return (
    <div className="relative">
      <HeroSection />

      <div className="max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 py-8 space-y-8">
        <FilterBar
          cuisines={cuisinesQuery.data || []}
          isLoadingCuisines={cuisinesQuery.isLoading}
          activeCuisineId={activeCuisineId}
          onCuisineChange={setActiveCuisineId}
          activeTag={activeTag}
          onTagChange={setActiveTag}
        />

        <CategoryGrid
          cuisines={cuisinesQuery.data}
          activeSlug={activeCuisineId}
          onSelect={setActiveCuisineId}
        />
        <BannerCarousel />

        <div>
          <h2
            key={activeTag ?? "none"}
            className="animate-fade-up font-serif font-bold text-xl mb-4 text-brand-dark"
          >
            {activeTagLabel ??
              (activeCuisineId
                ? t("restaurantsServingCuisine")
                : t("restaurantsNearYou"))}
          </h2>

          {restaurantsQuery.isLoading || !isResolved ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <RestaurantCardSkeleton key={i} />
              ))}
            </div>
          ) : restaurantsQuery.isError ? (
            <div className="flex flex-col items-center text-center py-16 gap-3">
              <AlertTriangle className="text-neutral-300" size={28} />
              <p className="text-sm text-neutral-500">
                {t("couldntLoad")}{" "}
                <span className="font-mono">localhost:3005</span>?
              </p>
              <button
                onClick={() => restaurantsQuery.refetch()}
                className="text-sm font-medium bg-[#171410] text-white px-4 py-2 rounded-full"
              >
                {t("retry")}
              </button>
            </div>
          ) : restaurants.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-sm text-neutral-400">
                {t("noRestaurantsFound", {
                  cuisine: activeCuisineId ? "true" : "false",
                })}
              </p>
            </div>
          ) : (
            <div
              key={`${activeTag ?? "all"}-${activeCuisineId ?? "any"}`}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
            >
              {restaurants.map((restaurant, i) => (
                <div
                  key={restaurant.id}
                  className="animate-fade-up"
                  style={{ animationDelay: `${Math.min(i, 8) * 60}ms` }}
                >
                  <RestaurantCard restaurant={restaurant} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <WhyLogicBit />
      <OwnerBanner />

      <PopupAd />
    </div>
  );
}