"use client";

import { use, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { Pager } from "@/components/ui/pager";
import { CitiesNearMe } from "@/components/home/cities-near-me";
import { listCities } from "@/lib/api/cities";
import { cityLabel, countCities, liveCities, sameCity } from "@/lib/utils/cities";
import { RestaurantCard } from "@/components/restaurant/restaurant-card";
import { RestaurantCardSkeleton } from "@/components/restaurant/restaurant-card-skeleton";
import { Button, Chip, Icon, IconButton } from "@/components/ui/primitives";
import { getAllNearby } from "@/lib/api/discovery";
import { cuisineImage, cuisineSlug, matchesQuery } from "@/lib/utils/cuisine";
import { listCuisines } from "@/lib/api/cuisines";
import { useCuisineLabel } from "@/hooks/use-cuisine-label";
import { useGeolocation } from "@/hooks/use-geolocation";
import type { DiscoveryRestaurant } from "@/types/restaurant";

const CUISINE_COLORS = [
  { color: "var(--brand-chili)", ink: "var(--brand-parchment)" },
  { color: "var(--brand-saffron)", ink: "var(--brand-espresso)" },
  { color: "var(--brand-herb)", ink: "var(--brand-parchment)" },
  { color: "var(--brand-tangerine)", ink: "var(--brand-espresso)" },
  { color: "var(--brand-blush)", ink: "var(--brand-espresso)" },
];

const QUICK = ["open", "rating", "fast"] as const;
type Quick = (typeof QUICK)[number];
const QUICK_LABEL = { open: "quickOpen", rating: "quickRating", fast: "quickFast" } as const;
const SORTS = ["recommended", "rating", "time", "distance"] as const;
type Sort = (typeof SORTS)[number];
const SORT_LABEL = { recommended: "sortRecommended", rating: "sortRating", time: "sortTime", distance: "sortDistance" } as const;
const PAGE_SIZE = 9;

const pass: Record<Quick, (r: DiscoveryRestaurant) => boolean> = {
  open: (r) => r.isOpen !== false,
  rating: (r) => (r.avgRating ?? 0) >= 4.5,
  fast: (r) => (r.estimatedDeliveryMinutes ?? Infinity) < 30,
};
const sorters: Record<Sort, (a: DiscoveryRestaurant, b: DiscoveryRestaurant) => number> = {
  recommended: (a, b) => Number(b.isOpen !== false) - Number(a.isOpen !== false) || Number(!!b.isSponsored) - Number(!!a.isSponsored),
  rating: (a, b) => (b.avgRating ?? 0) - (a.avgRating ?? 0),
  time: (a, b) => (a.estimatedDeliveryMinutes ?? 999) - (b.estimatedDeliveryMinutes ?? 999),
  distance: (a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999),
};

function StateBox({ kind, onAction }: { kind: "empty" | "error"; onAction: () => void }) {
  const t = useTranslations("restaurants");
  return (
    <div className="col-span-full mx-auto max-w-lg py-12 text-center" role={kind === "error" ? "alert" : "status"}>
      <svg viewBox="0 0 240 180" className="mx-auto w-56" aria-hidden>
        <ellipse cx="120" cy="165" rx="90" ry="10" fill="currentColor" opacity=".08" />
        <path d="M40 150V80a80 80 0 01160 0v70z" className={kind === "error" ? "fill-herb" : "fill-saffron"} />
        <rect x="70" y="95" width="100" height="55" rx="10" fill="var(--color-paper)" />
        <circle cx="100" cy="115" r="5" fill="currentColor" />
        <circle cx="140" cy="115" r="5" fill="currentColor" />
        <path d={kind === "error" ? "M105 136h30" : "M104 138c10-8 22-8 32 0"} stroke="currentColor" strokeWidth="5" fill="none" strokeLinecap="round" />
        <path d="M120 0v20M90 6l8 16M150 6l-8 16" stroke="var(--brand-chili)" strokeWidth="5" strokeLinecap="round" />
      </svg>
      <h2 className="mt-6 font-display text-[32px] font-extrabold leading-tight">{kind === "empty" ? t("emptyTitle") : t("errorTitle")}</h2>
      <p className="mt-2 text-lg text-ink/75">{kind === "empty" ? t("emptyBody") : t("errorBody")}</p>
      <Button size="lg" variant={kind === "empty" ? "accent" : "ink"} className="mt-6" onClick={onAction}>
        {kind === "empty" ? t("clearFilters") : t("errorRetry")}
      </Button>
    </div>
  );
}

function SortSelect({ value, onChange, id }: { value: Sort; onChange: (s: Sort) => void; id: string }) {
  const t = useTranslations("restaurants");
  return (
    <label htmlFor={id} className="flex min-h-11 shrink-0 items-center gap-2 rounded-full bg-paper pl-4 pr-2 shadow-soft focus-within:ring-2 focus-within:ring-ink">
      <span className="text-ink/70">{t("sortBy")}</span>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value as Sort)} className="min-h-11 cursor-pointer bg-transparent pr-2 font-bold text-ink outline-none">
        {SORTS.map((s) => (
          <option key={s} value={s} className="bg-paper">{t(SORT_LABEL[s])}</option>
        ))}
      </select>
    </label>
  );
}

type Params = { q?: string; cuisine?: string; city?: string };

export default function RestaurantsPage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = use(searchParams);
  return <RestaurantsView key={`${params.q ?? ""}|${params.cuisine ?? ""}|${params.city ?? ""}`} params={params} />;
}

function RestaurantsView({ params }: { params: Params }) {
  const t = useTranslations("restaurants");
  const locale = useLocale();
  const cuisineLabel = useCuisineLabel();
  const { lat, lng, isResolved } = useGeolocation();
  const [cuisine, setCuisine] = useState(params.cuisine ?? "all");
  const [city, setCity] = useState(params.city ?? "");
  const [quick, setQuick] = useState<Quick[]>([]);
  const [sort, setSort] = useState<Sort>("recommended");
  const [q, setQ] = useState(params.q ?? "");
  const [sheet, setSheet] = useState(false);
  const [page, setPage] = useState(1);
  const listTop = useRef<HTMLElement>(null);

  const cuisinesQuery = useQuery({ queryKey: ["cuisines"], queryFn: listCuisines });
  const citiesQuery = useQuery({ queryKey: ["cities"], queryFn: listCities });
  const restaurantsQuery = useQuery({
    queryKey: ["nearby-restaurants", lat, lng, "all"],
    queryFn: () => getAllNearby(lat, lng),
    enabled: isResolved,
  });

  const rows = useMemo(() => restaurantsQuery.data?.rows ?? [], [restaurantsQuery.data]);
  const capped = (restaurantsQuery.data?.total ?? 0) > rows.length;
  const cuisines = cuisinesQuery.data ?? [];
  const cities = useMemo(() => citiesQuery.data ?? [], [citiesQuery.data]);

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const selected = cities.find((c) => sameCity(c, city)) ?? { name: city };
    return rows
      .filter((r) => cuisine === "all" || (r.cuisines ?? []).some((c) => cuisineSlug(c) === cuisine))
      .filter((r) => !city || sameCity(selected, r.city))
      .filter((r) => quick.every((f) => pass[f](r)))
      .filter((r) => matchesQuery(r, needle))
      .sort(sorters[sort]);
  }, [rows, cities, cuisine, city, quick, q, sort]);

  const filterKey = JSON.stringify([cuisine, city, quick, q, sort]);
  const [lastFilterKey, setLastFilterKey] = useState(filterKey);
  if (filterKey !== lastFilterKey) {
    setLastFilterKey(filterKey);
    setPage(1);
  }
  const pageCount = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  const visible = list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const changePage = (p: number) => {
    setPage(p);
    listTop.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const cityCounts = useMemo(() => countCities(rows), [rows]);
  const labelFor = (name: string) => {
    const c = cities.find((x) => sameCity(x, name));
    return c ? cityLabel(c, locale) : name;
  };
  const loading = !isResolved || restaurantsQuery.isLoading;
  const active = quick.length + (cuisine !== "all" ? 1 : 0) + (city ? 1 : 0);
  const clear = () => {
    setQuick([]);
    setCuisine("all");
    setCity("");
    setQ("");
  };
  const toggle = (f: Quick) => setQuick((x) => (x.includes(f) ? x.filter((i) => i !== f) : [...x, f]));
  const openCount = list.filter((r) => r.isOpen !== false).length;
  const cuisineOptions = [{ id: "all", name: t("allCuisines"), slug: "all" }, ...cuisines.map((c) => ({ id: c.id, name: cuisineLabel(c), slug: c.slug ?? cuisineSlug(c.name) }))];
  const bold = (chunks: React.ReactNode) => <b>{chunks}</b>;

  return (
    <div>
      <header className="relative mx-auto w-full max-w-[1440px] overflow-hidden px-5 pb-8 md:px-10">
        <div className="relative">
          <Link href="/" className="flex min-h-11 items-center gap-1 font-bold"><Icon name="back" />{t("backHome")}</Link>
          <h1 className="mt-4 font-display text-[48px] font-extrabold leading-[0.95] tracking-tight md:text-[96px]">
            {t("titleStart")}<span className="text-chili">.</span>
          </h1>
          <p className="mt-6 text-lg text-ink/80">
            {city ? t.rich("summaryCity", { b: bold, count: list.length, city: labelFor(city), open: openCount }) : t.rich("summary", { b: bold, count: list.length, open: openCount })}
          </p>
          <form onSubmit={(e) => e.preventDefault()} className="shadow-warm mt-4 flex max-w-3xl items-center gap-2 rounded-full border-[3px] border-ink bg-paper p-1.5">
            <Icon name="search" className="ml-3 h-6 w-6 shrink-0 text-ink/60" />
            <label htmlFor="rs" className="sr-only">{t("searchLabel")}</label>
            <input id="rs" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("searchLabel")} className="min-h-12 min-w-0 flex-1 bg-transparent text-lg outline-none placeholder:text-ink/55" />
            {q && <IconButton icon="x" label={t("clearSearch")} onClick={() => setQ("")} className="hover:bg-ink/10" />}
            <button type="submit" className="shadow-red grid h-12 shrink-0 place-items-center rounded-full bg-chili px-4 font-bold text-parchment md:px-6" aria-label={t("search")}>
              <span className="hidden md:inline">{t("search")}</span>
              <Icon name="search" className="h-5 w-5 md:hidden" />
            </button>
          </form>
        </div>

        <div className="no-scrollbar relative -mx-5 mt-8 flex gap-3 overflow-x-auto px-5 pb-3 pt-1 md:mx-0 md:px-0" role="radiogroup" aria-label={t("cuisine")}>
          {cuisineOptions.map((c, i) => {
            const on = cuisine === c.slug;
            const palette = i === 0 ? { color: "var(--brand-espresso)", ink: "var(--brand-parchment)" } : CUISINE_COLORS[(i - 1) % CUISINE_COLORS.length];
            return (
              <button
                key={c.id}
                role="radio"
                aria-checked={on}
                onClick={() => setCuisine(c.slug)}
                style={on ? { background: palette.color, color: palette.ink } : undefined}
                className={`flex min-h-14 shrink-0 items-center gap-3 rounded-full py-1.5 pl-1.5 pr-5 font-display text-lg font-bold transition ${on ? "shadow-hard -translate-y-0.5" : "bg-paper shadow-soft hover:-translate-y-0.5"}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={i === 0 ? "/images/cuisine-chinese.jpg.avif" : cuisineImage(c.slug)} alt="" className="h-11 w-11 rounded-full object-cover" />
                {c.name}
              </button>
            );
          })}
        </div>
      </header>

      <div className="sticky top-0 z-30 border-y border-ink/10 bg-cream/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-[1440px] items-center gap-3 px-5 py-3 md:px-10">
          <div className="no-scrollbar hidden flex-1 gap-2 overflow-x-auto lg:flex" role="group" aria-label={t("quickFilters")}>
            {QUICK.map((f) => (
              <Chip key={f} active={quick.includes(f)} aria-pressed={quick.includes(f)} onClick={() => toggle(f)}>
                {quick.includes(f) && <Icon name="check" className="mr-1 inline h-4 w-4" />}
                {t(QUICK_LABEL[f])}
              </Chip>
            ))}
          </div>
          <Button variant="outline" className="lg:hidden" onClick={() => setSheet(true)} aria-haspopup="dialog">
            {t("filters")}
            {active > 0 && <span className="grid h-6 min-w-6 place-items-center rounded-full bg-chili px-1.5 text-base text-parchment">{active}</span>}
          </Button>
          {active > 0 && (
            <button onClick={clear} className="hidden min-h-11 shrink-0 items-center gap-2 font-bold text-chili underline underline-offset-4 lg:flex">
              <span className="grid h-6 min-w-6 place-items-center rounded-full bg-chili px-1.5 text-parchment no-underline">{active}</span>
              {t("clearFilters")}
            </button>
          )}
          <div className="ml-auto"><SortSelect id="sort" value={sort} onChange={setSort} /></div>
        </div>
      </div>

      <section ref={listTop} className="mx-auto w-full max-w-[1440px] scroll-mt-16 px-5 py-10 md:px-10">
        <div className="mb-8 flex items-center justify-between">
          <p className="text-lg text-ink/75" aria-live="polite">
            {loading ? t("finding") : restaurantsQuery.isError || list.length === 0 ? "" : t("showing", { from: (page - 1) * PAGE_SIZE + 1, to: (page - 1) * PAGE_SIZE + visible.length, total: list.length })}
          </p>
          {active > 0 && <button onClick={clear} className="min-h-11 font-bold text-chili underline underline-offset-4 lg:hidden">{t("clearFiltersCount", { count: active })}</button>}
        </div>
        <div className="grid gap-x-8 gap-y-12 md:grid-cols-2 xl:grid-cols-3">
          {loading && [0, 1, 2].map((i) => <RestaurantCardSkeleton key={i} />)}
          {!loading && restaurantsQuery.isError && <StateBox kind="error" onAction={() => restaurantsQuery.refetch()} />}
          {!loading && !restaurantsQuery.isError && list.length === 0 && <StateBox kind="empty" onAction={clear} />}
          {!loading && !restaurantsQuery.isError && visible.map((r, i) => <RestaurantCard key={r.id} r={r} index={i} />)}
        </div>

        {capped && <p className="mt-8 text-center text-ink/75">{t("capped", { shown: rows.length, total: restaurantsQuery.data?.total ?? rows.length })}</p>}
        {!loading && <div className="mt-14"><Pager page={page} pageCount={pageCount} onChange={changePage} /></div>}
      </section>

      <div className="mt-12"><CitiesNearMe cities={cities} counts={cityCounts} selected={city} loading={loading} /></div>

      {sheet && (
        <div className="fixed inset-0 z-50 flex items-end bg-espresso/60 lg:hidden" onClick={() => setSheet(false)}>
          <div role="dialog" aria-modal="true" aria-labelledby="fl" onClick={(e) => e.stopPropagation()} className="sheet-in flex max-h-[88vh] w-full flex-col rounded-t-[32px] bg-cream text-ink">
            <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-ink/20" />
            <div className="flex items-center justify-between px-5 pt-3">
              <h2 id="fl" className="font-display text-[28px] font-extrabold">{t("filters")}{active > 0 && <span className="ml-2 text-chili">({active})</span>}</h2>
              <IconButton icon="x" label={t("closeFilters")} onClick={() => setSheet(false)} className="bg-paper" />
            </div>
            <div className="flex-1 space-y-6 overflow-y-auto px-5 py-4">
              <div>
                <p className="mb-3 font-bold">{t("quickFilters")}</p>
                <div className="flex flex-wrap gap-2">
                  {QUICK.map((f) => <Chip key={f} active={quick.includes(f)} aria-pressed={quick.includes(f)} onClick={() => toggle(f)}>{t(QUICK_LABEL[f])}</Chip>)}
                </div>
              </div>
              <div>
                <p className="mb-3 font-bold">{t("cuisine")}</p>
                <div className="flex flex-wrap gap-2">
                  {cuisineOptions.map((c) => <Chip key={c.id} active={cuisine === c.slug} onClick={() => setCuisine(c.slug)}>{c.name}</Chip>)}
                </div>
              </div>
              <div>
                <p className="mb-3 font-bold">{t("city")}</p>
                <div className="flex flex-wrap gap-2">
                  {liveCities(cities, cityCounts).map((c) => <Chip key={c.id} active={city === c.name} onClick={() => setCity(city === c.name ? "" : c.name)}>{cityLabel(c, locale)}</Chip>)}
                </div>
              </div>
              <div>
                <p className="mb-3 font-bold">{t("sort")}</p>
                <SortSelect id="sort-m" value={sort} onChange={setSort} />
              </div>
            </div>
            <div className="flex items-center gap-3 border-t border-ink/10 p-4">
              <Button variant="ghost" onClick={clear} disabled={!active}>{t("clearFilters")}</Button>
              <Button size="lg" full className="flex-1" onClick={() => setSheet(false)}>{t("showN", { count: list.length })}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
