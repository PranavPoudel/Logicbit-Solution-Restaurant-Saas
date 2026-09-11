// app/(customer)/page.tsx
"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import { HeroSection } from "@/components/home/hero-section";
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
import { theme } from "@/config/theme";

export default function HomePage() {
  const { lat, lng, isResolved } = useGeolocation();

  // 1. State for the active cuisine filter
  const [activeCuisineId, setActiveCuisineId] = useState<string | null>(null);

  // 2. Fetch dynamic cuisines from the backend
  const cuisinesQuery = useQuery({
    queryKey: ["cuisines"],
    queryFn: listCuisines,
  });

  // 3. Fetch nearby restaurants, now reactive to the activeCuisineId
  const restaurantsQuery = useQuery({
    queryKey: ["nearby-restaurants", lat, lng, activeCuisineId],
    queryFn: () =>
      getNearbyRestaurants({
        lat,
        lng,
        radiusKm: 10,
        cuisineType: activeCuisineId || undefined // Pass undefined if no cuisine is selected
      }),
    enabled: isResolved,
  });

  const restaurants = restaurantsQuery.data?.data ?? [];

  return (
    <div>
      <HeroSection />

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Pass dynamic data and handlers to the filter component */}
        <FilterBar
          cuisines={cuisinesQuery.data || []}
          isLoadingCuisines={cuisinesQuery.isLoading}
          activeCuisineId={activeCuisineId}
          onCuisineChange={setActiveCuisineId}
        />

        <CategoryGrid />
        <BannerCarousel />

        <div>
          <h2 className="font-serif font-semibold text-lg mb-4" style={{ color: theme.colors.dark }}>
            {activeCuisineId
              ? theme.content.restaurantsForCuisineHeading
              : theme.content.restaurantsNearYouHeading}
          </h2>

          {restaurantsQuery.isLoading || !isResolved ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <RestaurantCardSkeleton key={i} />
              ))}
            </div>
          ) : restaurantsQuery.isError ? (
            <div className="flex flex-col items-center text-center py-16 gap-3">
              <AlertTriangle style={{ color: `${theme.colors.dark}40` }} size={28} />
              <p className="text-sm" style={{ color: `${theme.colors.dark}8C` }}>
                {theme.content.backendErrorMessage}{" "}
                <span className="font-mono">localhost:3700</span>?
              </p>
              <button
                onClick={() => restaurantsQuery.refetch()}
                className="text-sm font-medium px-4 py-2 rounded-full"
                style={{ backgroundColor: theme.colors.dark, color: theme.colors.background }}
              >
                {theme.content.retryLabel}
              </button>
            </div>
          ) : restaurants.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-sm" style={{ color: `${theme.colors.dark}66` }}>
                {activeCuisineId
                  ? theme.content.noRestaurantsCuisineMessage
                  : theme.content.noRestaurantsNearbyMessage}
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

      <PopupAd />

      <HomepageFooter />
    </div>
  );
}