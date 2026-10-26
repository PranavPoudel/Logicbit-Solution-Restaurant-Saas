// components/home/restaurants-near-you.tsx
"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/ui/primitives";
import { RestaurantCard } from "@/components/restaurant/restaurant-card";
import { RestaurantCardSkeleton } from "@/components/restaurant/restaurant-card-skeleton";
import type { DiscoveryRestaurant } from "@/types/restaurant";

export function RestaurantsNearYou({ restaurants, loading, error, onRetry }: { restaurants: DiscoveryRestaurant[]; loading: boolean; error: boolean; onRetry: () => void }) {
  const t = useTranslations("home");
  return (
    <section id="restaurants" className="relative bg-saffron/25 py-16">
      <div className="mx-auto w-full max-w-[1440px] px-5 md:px-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="font-display text-5xl font-extrabold leading-none tracking-tight md:text-7xl">
            {t("openKitchens")}
          </h2>
          <Link href="/restaurants" className="group shadow-hard inline-flex h-14 items-center gap-4 rounded-full bg-ink pl-7 pr-2 text-lg font-bold text-cream transition hover:-translate-y-0.5 hover:bg-chili active:translate-y-0">
            {t("seeAllKitchens")}
            <span className="grid h-10 w-10 place-items-center rounded-full bg-saffron text-espresso transition group-hover:translate-x-1"><Icon name="arrow" className="h-5 w-5" /></span>
          </Link>
        </div>
        <div className="mt-12 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {loading && [0, 1, 2].map((i) => <RestaurantCardSkeleton key={i} />)}
          {!loading && error && (
            <div className="col-span-full py-8 text-center" role="alert">
              <p className="text-lg">{t("loadKitchensError")}</p>
              <button onClick={onRetry} className="mt-3 min-h-11 rounded-full bg-ink px-6 font-bold text-cream">{t("tryAgain")}</button>
            </div>
          )}
          {!loading && !error && restaurants.length === 0 && <p className="col-span-full py-8 text-center text-lg">{t("noKitchensYet")}</p>}
          {!loading && !error && restaurants.slice(0, 6).map((r, i) => <RestaurantCard key={r.id} r={r} index={i} />)}
        </div>
      </div>
    </section>
  );
}
