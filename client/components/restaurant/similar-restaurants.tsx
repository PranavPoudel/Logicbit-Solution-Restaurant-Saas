// components/restaurant/similar-restaurants.tsx
"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { RestaurantCard } from "@/components/restaurant/restaurant-card";
import type { DiscoveryRestaurant } from "@/types/restaurant";
import { Icon, Squiggle } from "@/components/ui/primitives";

export function SimilarRestaurants({ restaurants, loading, error, onRetry }: { restaurants: DiscoveryRestaurant[]; loading: boolean; error: boolean; onRetry: () => void }) {
  const t = useTranslations("restaurant");
  const tc = useTranslations("common");
  if (!loading && !error && restaurants.length === 0) return null;
  return (
    <section aria-labelledby="similar" className="mx-auto mt-12 w-full max-w-[1440px] border-t border-ink/10 px-5 pt-10 md:px-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 id="similar" className="relative inline-block font-display text-[32px] font-extrabold tracking-tight md:text-[40px]">
          {t("similar")}
          <Squiggle className="absolute -bottom-1 left-0 h-3 w-full text-[var(--accent,var(--brand-chili))]" />
        </h2>
        <Link href="/restaurants" className="group flex min-h-11 items-center gap-2 font-bold">
          <span className="underline-offset-4 group-hover:underline">{t("seeAll")}</span>
          <Icon name="arrow" className="h-5 w-5 transition group-hover:translate-x-1" />
        </Link>
      </div>
      {error ? (
        <div role="alert" className="mt-8 flex flex-wrap items-center gap-4 rounded-[28px] border-2 border-dashed border-chili/50 bg-chili/5 p-6">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-chili/10 text-chili"><Icon name="alert" /></span>
          <p className="flex-1 text-lg font-bold">{t("errSimilar")}</p>
          <button type="button" onClick={onRetry} className="inline-flex min-h-11 items-center rounded-full bg-ink px-5 font-bold text-cream">{tc("retry")}</button>
        </div>
      ) : (
        <ul className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {loading
            ? [0, 1, 2].map((i) => <li key={i} className="h-[380px] animate-pulse rounded-[28px] bg-ink/10" aria-hidden />)
            : restaurants.map((r, i) => <li key={r.id}><RestaurantCard r={r} index={i} /></li>)}
        </ul>
      )}
    </section>
  );
}
