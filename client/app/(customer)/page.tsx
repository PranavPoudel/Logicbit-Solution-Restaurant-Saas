// app/(customer)/page.tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import { HeroSection } from "@/components/home/hero-section";
import { CategoryGrid } from "@/components/home/category-grid";
import { BannerCarousel } from "@/components/home/banner-carousel";
import { FilterBar } from "@/components/home/filter-bar";
import { RestaurantCard } from "@/components/restaurant/restaurant-card";
import { RestaurantCardSkeleton } from "@/components/restaurant/restaurant-card-skeleton";
import { PopupAd } from "@/components/home/popup-ad";
import { getNearbyRestaurants } from "@/lib/api/discovery";
import { useGeolocation } from "@/hooks/use-geolocation";

export default function HomePage() {
  const { lat, lng, isResolved } = useGeolocation();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["nearby-restaurants", lat, lng],
    queryFn: () => getNearbyRestaurants({ lat, lng, radiusKm: 10 }),
    enabled: isResolved,
  });

  const restaurants = data?.data ?? [];

  return (
    <div>
      <HeroSection />

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <CategoryGrid />
        <BannerCarousel />
        <FilterBar />

        <div>
          <h2 className="font-display font-semibold text-lg text-[#17181C] mb-4">
            Restaurants near you
          </h2>

          {isLoading || !isResolved ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <RestaurantCardSkeleton key={i} />
              ))}
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center text-center py-16 gap-3">
              <AlertTriangle className="text-neutral-300" size={28} />
              <p className="text-sm text-neutral-500">
                Couldn&apos;t load restaurants. Is the backend running on{" "}
                <span className="font-mono">localhost:3700</span>?
              </p>
              <button
                onClick={() => refetch()}
                className="text-sm font-medium bg-[#17181C] text-white px-4 py-2 rounded-full"
              >
                Retry
              </button>
            </div>
          ) : restaurants.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-sm text-neutral-400">
                No restaurants found near you yet.
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
    </div>
  );
}
