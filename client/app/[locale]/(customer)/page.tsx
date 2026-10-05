"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import { HeroSection } from "@/components/home/hero-section";
import { WhyLogicBit } from "@/components/home/why-logicbit";
import { OwnerBanner } from "@/components/home/owner-banner";
import { CategoryGrid } from "@/components/home/category-grid";
import { BannerCarousel } from "@/components/home/banner-carousel";
import { FilterBar } from "@/components/home/filter-bar";
import { RestaurantCard } from "@/components/restaurant/restaurant-card";
import { RestaurantCardSkeleton } from "@/components/restaurant/restaurant-card-skeleton";
import { PopupAd } from "@/components/home/popup-ad";
import { HomepageFooter } from "@/components/home/homepage-footer";
import { getNearbyRestaurants } from "@/lib/api/discovery";
import { listCuisines } from "@/lib/api/cuisines";
import { useGeolocation } from "@/hooks/use-geolocation";

export default function HomePage() {
  const t = useTranslations("home");
  const { lat, lng, isResolved } = useGeolocation();
  const [activeCuisineId, setActiveCuisineId] = useState<string | null>(null);

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

  const restaurants = restaurantsQuery.data?.data ?? [];

  return (
    <div className="relative min-h-screen">
      <HeroSection />

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <FilterBar
          cuisines={cuisinesQuery.data || []}
          isLoadingCuisines={cuisinesQuery.isLoading}
          activeCuisineId={activeCuisineId}
          onCuisineChange={setActiveCuisineId}
        />

        <CategoryGrid />
        <BannerCarousel />

        <div>
          <h2 className="font-display font-semibold text-lg text-[#17181C] mb-4">
            {activeCuisineId
              ? t("restaurantsServingCuisine")
              : t("restaurantsNearYou")}
          </h2>

          {restaurantsQuery.isLoading || !isResolved ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <RestaurantCardSkeleton key={i} />
              ))}
            </div>
          ) : restaurantsQuery.isError ? (
            <div className="flex flex-col items-center text-center py-16 gap-3">
              <AlertTriangle className="text-neutral-300" size={28} />
              <p className="text-sm text-neutral-500">
                {t("couldntLoad")}{" "}
                <span className="font-mono">localhost:3700</span>?
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
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {restaurants.map((restaurant) => (
                <RestaurantCard key={restaurant.id} restaurant={restaurant} />
              ))}
            </div>
          )}
        </div>
      </div>

      <WhyLogicBit />
      <OwnerBanner />

      <PopupAd />
      <HomepageFooter />
    </div>
  );
}