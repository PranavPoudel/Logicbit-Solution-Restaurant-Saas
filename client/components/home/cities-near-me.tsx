// components/home/cities-near-me.tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { DynamicCitiesMap } from "@/components/map/dynamic-cities-map";
import { Icon, Squiggle } from "@/components/ui/primitives";
import type { City } from "@/lib/api/cities";
import { cityLabel, liveCities, sameCity, type CityCounts } from "@/lib/utils/cities";

export function CitiesNearMe({ cities, counts, selected, loading }: { cities: City[]; counts: CityCounts; selected?: string; loading?: boolean }) {
  const t = useTranslations("cities");
  const locale = useLocale();
  const router = useRouter();
  const live = liveCities(cities, counts);

  const pick = (name: string) => router.push(`/restaurants?city=${encodeURIComponent(name)}`);

  return (
    <section aria-labelledby="cities" className="mx-auto w-full max-w-[1440px] px-5 py-16 md:px-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 id="cities" className="font-display text-[40px] font-extrabold leading-tight tracking-tight md:text-[56px]">
          {t("titleStart")}{" "}
          <span className="relative inline-block">
            {t("titleAccent")}
            <Squiggle className="absolute -bottom-1 left-0 h-3 w-full text-saffron md:h-4" />
          </span>
        </h2>
        <Link href="/restaurants" className="group flex min-h-11 items-center gap-2 font-bold hover:text-chili">
          <span className="underline-offset-4 group-hover:underline">{t("viewAll")}</span>
          <Icon name="arrow" className="h-5 w-5 transition group-hover:translate-x-1" />
        </Link>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_440px]">
        <div className="shadow-warm relative aspect-[540/280] min-h-[240px] w-full overflow-hidden rounded-[28px] bg-map-sea">
          {loading ? <div className="shimmer absolute inset-0" role="status" aria-label={t("loadingMap")} /> : <DynamicCitiesMap cities={live} onPick={pick} />}
        </div>

        <div className="flex flex-col gap-5">
          <div>
            <p className="flex items-center gap-2 text-base font-bold uppercase tracking-wider text-ink/70">
              <span className="h-3 w-3 animate-pulse rounded-full bg-herb motion-reduce:animate-none" />
              {t("deliveringNow", { count: live.length })}
            </p>
            <ul className="mt-4 space-y-3">
              {live.map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => pick(c.name)}
                    className={`shadow-soft group flex min-h-20 w-full items-center gap-4 rounded-2xl border-2 px-5 text-left transition hover:-translate-y-0.5 ${selected && sameCity(c, selected) ? "border-chili bg-chili/10" : "border-ink/10 bg-paper"}`}
                  >
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-chili text-cream"><Icon name="pin" className="h-6 w-6" /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-display text-2xl font-extrabold leading-tight">{cityLabel(c, locale)}</span>
                      <span className="block text-base text-ink/70">{t("kitchensOpen", { count: c.count })}</span>
                    </span>
                    <Icon name="arrow" className="h-6 w-6 shrink-0 transition group-hover:translate-x-1" />
                  </button>
                </li>
              ))}
              {!loading && live.length === 0 && <li className="text-ink/65">{t("noneYet")}</li>}
            </ul>
          </div>

        </div>
      </div>
    </section>
  );
}
