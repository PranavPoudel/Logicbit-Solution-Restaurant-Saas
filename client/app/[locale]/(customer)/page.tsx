"use client";

import { Fragment, useMemo, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocale } from "next-intl";
import { CitiesNearMe } from "@/components/home/cities-near-me";
import { HeroSection } from "@/components/home/hero-section";
import { CuisineSelector } from "@/components/home/cuisine-selector";
import { RestaurantsNearYou } from "@/components/home/restaurants-near-you";
import { TrendingDishes, type TrendingDish } from "@/components/home/trending-dishes";
import { BannerCarousel } from "@/components/home/banner-carousel";
import { HowItWorks } from "@/components/home/how-it-works";
import { WhyLogicBit } from "@/components/home/why-logicbit";
import { OwnerBanner } from "@/components/home/owner-banner";
import { PopupAd } from "@/components/home/popup-ad";
import { getAllNearby, getTrendingItems } from "@/lib/api/discovery";
import { listCuisines } from "@/lib/api/cuisines";
import { listCities } from "@/lib/api/cities";
import { cityLabel, countCities, pickHomeCity } from "@/lib/utils/cities";
import { useGeolocation } from "@/hooks/use-geolocation";
import { useIsMounted } from "@/hooks/use-is-mounted";
import { useCustomerAuthStore } from "@/store/customer-auth-store";
import { theme, type HomeSection } from "@/config/theme";

const SECTIONS = theme.layout.homeSections;

export default function HomePage() {
  const locale = useLocale();
  const { lat, lng, position, isResolved } = useGeolocation();
  const mounted = useIsMounted();
  const signedIn = useCustomerAuthStore((s) => s.isAuthenticated);
  const showGuestSections = mounted && !signedIn;

  const cuisinesQuery = useQuery({ queryKey: ["cuisines"], queryFn: listCuisines });
  const citiesQuery = useQuery({ queryKey: ["cities"], queryFn: listCities });

  const restaurantsQuery = useQuery({
    queryKey: ["nearby-restaurants", lat, lng, "all"],
    queryFn: () => getAllNearby(lat, lng),
    enabled: isResolved,
  });

  const restaurants = useMemo(() => restaurantsQuery.data?.rows ?? [], [restaurantsQuery.data]);
  const cuisines = cuisinesQuery.data ?? [];
  const cities = useMemo(() => citiesQuery.data ?? [], [citiesQuery.data]);

  const trendingQuery = useQuery<(Omit<TrendingDish, "restaurant" | "slug" | "currencyCode"> & { restaurant: { name: string; slug: string; currencyCode?: string } })[]>({
    queryKey: ["trending-items"],
    queryFn: getTrendingItems,
    enabled: showGuestSections && SECTIONS.includes("trending"),
  });

  const trending = useMemo<TrendingDish[]>(
    () => (trendingQuery.data ?? []).map((d) => ({ ...d, restaurant: d.restaurant.name, slug: d.restaurant.slug, currencyCode: d.restaurant.currencyCode })),
    [trendingQuery.data],
  );

  const cityCounts = useMemo(() => countCities(restaurants), [restaurants]);
  const homeCity = useMemo(() => pickHomeCity(cities, cityCounts, position), [cities, cityCounts, position]);

  const loading = !isResolved || restaurantsQuery.isLoading;
  const topRating = restaurants.reduce((max, r) => Math.max(max, r.avgRating ?? 0), 0);
  const rated = restaurants.filter((r) => (r.avgRating ?? 0) > 0);
  const averageRating = rated.length ? rated.reduce((sum, r) => sum + (r.avgRating ?? 0), 0) / rated.length : 0;

  const sections: Record<HomeSection, ReactNode> = {
    hero: <HeroSection city={homeCity && cityLabel(homeCity, locale)} cuisines={cuisines} openCount={restaurants.filter((r) => r.isOpen !== false).length} topRating={topRating} />,
    offers: <BannerCarousel />,
    cuisines: <CuisineSelector cuisines={cuisines} />,
    restaurants: <RestaurantsNearYou restaurants={restaurants} loading={loading} error={restaurantsQuery.isError} onRetry={() => restaurantsQuery.refetch()} />,
    trending: <TrendingDishes dishes={trending} />,
    howItWorks: <HowItWorks />,
    why: <WhyLogicBit rating={averageRating} />,
    owner: <OwnerBanner />,
    cities: <CitiesNearMe cities={cities} counts={cityCounts} loading={loading} />,
  };

  return (
    <div className="relative">
      {SECTIONS.filter((key) => showGuestSections || !theme.layout.guestOnlySections.includes(key)).map((key) => <Fragment key={key}>{sections[key]}</Fragment>)}
      <PopupAd />
    </div>
  );
}
