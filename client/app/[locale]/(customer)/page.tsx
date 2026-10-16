"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { CitiesNearMe } from "@/components/home/cities-near-me";
import { HeroSection } from "@/components/home/hero-section";
import { CuisineSelector } from "@/components/home/cuisine-selector";
import { RestaurantsNearYou } from "@/components/home/restaurants-near-you";
import { TrendingDishes, type TrendingDish } from "@/components/home/trending-dishes";
import { BannerCarousel } from "@/components/home/banner-carousel";
import { HowItWorks } from "@/components/home/how-it-works";
import { WhyLogicBit } from "@/components/home/why-logicbit";
import { OwnerBanner } from "@/components/home/owner-banner";
import { Marquee } from "@/components/ui/primitives";
import { PopupAd } from "@/components/home/popup-ad";
import { getAllNearby, getTrendingItems } from "@/lib/api/discovery";
import { listCuisines } from "@/lib/api/cuisines";
import { useGeolocation } from "@/hooks/use-geolocation";

export default function HomePage() {
  const { lat, lng, isResolved } = useGeolocation();

  const cuisinesQuery = useQuery({ queryKey: ["cuisines"], queryFn: listCuisines });

  const restaurantsQuery = useQuery({
    queryKey: ["nearby-restaurants", lat, lng, "all"],
    queryFn: () => getAllNearby(lat, lng),
    enabled: isResolved,
  });

  const restaurants = useMemo(() => restaurantsQuery.data?.rows ?? [], [restaurantsQuery.data]);
  const cuisines = cuisinesQuery.data ?? [];

  const trendingQuery = useQuery<(Omit<TrendingDish, "restaurant" | "slug"> & { restaurant: { name: string; slug: string } })[]>({
    queryKey: ["trending-items"],
    queryFn: getTrendingItems,
  });

  const trending = useMemo<TrendingDish[]>(
    () => (trendingQuery.data ?? []).map((d) => ({ ...d, restaurant: d.restaurant.name, slug: d.restaurant.slug })),
    [trendingQuery.data],
  );

  const cityCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    restaurants.forEach((r) => {
      if (r.city) counts[r.city] = (counts[r.city] ?? 0) + 1;
    });
    return counts;
  }, [restaurants]);

  const loading = !isResolved || restaurantsQuery.isLoading;
  const topRating = restaurants.reduce((max, r) => Math.max(max, r.avgRating ?? 0), 0);
  const rated = restaurants.filter((r) => (r.avgRating ?? 0) > 0);
  const averageRating = rated.length ? rated.reduce((sum, r) => sum + (r.avgRating ?? 0), 0) / rated.length : 0;

  return (
    <div className="relative">
      <HeroSection cuisines={cuisines} openCount={restaurants.filter((r) => r.isOpen !== false).length} topRating={topRating} />
      <BannerCarousel />
      <CuisineSelector cuisines={cuisines} />
      <RestaurantsNearYou restaurants={restaurants} loading={loading} error={restaurantsQuery.isError} onRetry={() => restaurantsQuery.refetch()} />
      <Marquee />
      <TrendingDishes dishes={trending} />
      <HowItWorks />
      <WhyLogicBit rating={averageRating} />
      <OwnerBanner />
      <CitiesNearMe counts={cityCounts} loading={loading} />
      <PopupAd />
    </div>
  );
}
