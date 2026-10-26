// app/(customer)/search/page.tsx
"use client";

import { use, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { RestaurantCard } from "@/components/restaurant/restaurant-card";
import { RestaurantCardSkeleton } from "@/components/restaurant/restaurant-card-skeleton";
import { Button, Icon, IconButton, Squiggle } from "@/components/ui/primitives";
import { getAllNearby } from "@/lib/api/discovery";
import { matchesQuery } from "@/lib/utils/cuisine";
import { useGeolocation } from "@/hooks/use-geolocation";

export default function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const t = useTranslations("search");
  const tr = useTranslations("restaurants");
  const params = use(searchParams);
  const [query, setQuery] = useState(params.q ?? "");
  const { lat, lng, isResolved } = useGeolocation();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["nearby-restaurants", lat, lng, "all"],
    queryFn: () => getAllNearby(lat, lng),
    enabled: isResolved,
  });

  const needle = query.trim().toLowerCase();
  const results = useMemo(
    () => (data?.rows ?? []).filter((r) => matchesQuery(r, needle)),
    [data, needle],
  );
  const loading = !isResolved || isLoading;

  return (
    <div className="mx-auto w-full max-w-[1440px] px-5 pb-16 md:px-10">
      <Link href="/" className="flex min-h-11 items-center gap-1 font-bold"><Icon name="back" />{tr("backHome")}</Link>
      <h1 className="mt-4 font-display text-[48px] font-extrabold leading-[0.95] tracking-tight md:text-[80px]">
        {t("title")}{" "}
        <span className="relative inline-block">
          {t("accent")}
          <Squiggle className="absolute -bottom-2 left-0 h-4 w-full text-chili md:-bottom-3 md:h-6" />
        </span>
      </h1>

      <form onSubmit={(e) => e.preventDefault()} className="shadow-warm mt-8 flex max-w-3xl items-center gap-2 rounded-full border-[3px] border-ink bg-paper p-1.5">
        <Icon name="search" className="ml-3 h-6 w-6 shrink-0 text-ink/60" />
        <label htmlFor="search-q" className="sr-only">{t("label")}</label>
        <input
          id="search-q"
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("label")}
          className="min-h-12 min-w-0 flex-1 bg-transparent text-lg outline-none placeholder:text-ink/55"
        />
        {query && <IconButton icon="x" label={tr("clearSearch")} onClick={() => setQuery("")} className="hover:bg-ink/10" />}
      </form>

      <p className="mt-8 text-lg text-ink/75" aria-live="polite">
        {loading ? tr("finding") : isError || results.length === 0 ? "" : needle ? t("countFor", { count: results.length, query: query.trim() }) : t("count", { count: results.length })}
      </p>

      <div className="mt-6 grid gap-x-8 gap-y-12 md:grid-cols-2 xl:grid-cols-3">
        {loading && [0, 1, 2].map((i) => <RestaurantCardSkeleton key={i} />)}
        {!loading && isError && (
          <div className="col-span-full py-10 text-center" role="alert">
            <h2 className="font-display text-[32px] font-extrabold">{t("loadError")}</h2>
            <p className="mt-2 text-lg text-ink/75">{t("loadErrorBody")}</p>
            <Button size="lg" variant="ink" className="mt-6" onClick={() => refetch()}>{tr("errorRetry")}</Button>
          </div>
        )}
        {!loading && !isError && results.length === 0 && (
          <div className="col-span-full py-10 text-center" role="status">
            <h2 className="font-display text-[32px] font-extrabold">{needle ? t("noneFor", { query: query.trim() }) : t("noneYet")}</h2>
            <p className="mt-2 text-lg text-ink/75">{t("tryAnother")}</p>
            {needle && <Button size="lg" className="mt-6" onClick={() => setQuery("")}>{tr("clearSearch")}</Button>}
          </div>
        )}
        {!loading && !isError && results.map((r, i) => <RestaurantCard key={r.id} r={r} index={i} />)}
      </div>
    </div>
  );
}
