// components/home/hero-section.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Arrow, Squiggle, Stamp } from "@/components/ui/primitives";
import { theme } from "@/config/theme";
import { byCuisineOrder } from "@/lib/utils/cuisine";
import { useCuisineLabel } from "@/hooks/use-cuisine-label";
import type { Cuisine } from "@/lib/api/cuisines";

export function HeroSection({ cuisines, openCount, topRating }: { cuisines: Cuisine[]; openCount: number; topRating: number }) {
  const t = useTranslations("home");
  const { heroImages } = theme.brand;
  const cuisineLabel = useCuisineLabel();
  const router = useRouter();
  const [q, setQ] = useState("");
  const chips = byCuisineOrder(cuisines).slice(0, 5);

  const search = (value: string) => router.push(value ? `/restaurants?q=${encodeURIComponent(value)}` : "/restaurants");

  return (
    <section className="relative mx-auto w-full max-w-[1440px] px-5 pb-12 md:px-10">
      <div className="blob absolute -right-40 -top-24 h-[520px] w-[520px] bg-saffron md:-right-24 md:-top-28 md:h-[860px] md:w-[860px]" aria-hidden />
      <div className="absolute right-[38%] top-[420px] hidden h-28 w-28 rounded-full bg-herb md:block" aria-hidden />

      <div className="relative grid gap-8 md:grid-cols-12 md:gap-0">
        <div className="relative z-20 pt-4 md:col-span-7 md:pt-10">
          <span className="inline-flex -rotate-2 items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-bold text-cream">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-herb" />
            {openCount > 0 ? t("openRight", { count: openCount }) : t("openSoon")}
          </span>
          <h1 className="font-display mt-6 text-[17vw] font-extrabold leading-[0.82] tracking-[-0.05em] md:text-[176px]">
            <span className="block">
              {t("heroA")}<span className="text-chili">{t("heroB")}</span>{t("heroC")}
            </span>
            <span className="relative inline-block">
              {t("heroD")}<span className="text-chili">{t("heroE")}</span>
              <Squiggle className="absolute -bottom-3 left-0 h-6 w-full text-chili md:-bottom-5 md:h-10" />
            </span>
          </h1>
          <p className="mt-8 max-w-md text-lg leading-relaxed">{t.rich("heroBody", { b: (chunks) => <b>{chunks}</b> })}</p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              search(q.trim());
            }}
            className="shadow-hard mt-8 flex max-w-xl items-center gap-2 rounded-full border-[3px] border-ink bg-paper p-1.5"
          >
            <span className="pl-3 text-xl" aria-hidden>⌕</span>
            <label htmlFor="home-search" className="sr-only">{t("searchLabel")}</label>
            <input id="home-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("searchPlaceholder")} className="min-h-11 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-ink/55" />
            <button type="submit" className="min-h-11 shrink-0 rounded-full bg-chili px-5 font-bold text-cream hover:bg-ink">{t("findFood")}</button>
          </form>
          {chips.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-ink/70">{t("popularCuisines")}</span>
              {chips.map((c, i) => (
                <Link
                  key={c.id}
                  href={`/restaurants?cuisine=${encodeURIComponent(c.slug ?? c.name)}`}
                  className={`inline-flex min-h-11 items-center rounded-full border-2 px-4 text-sm font-bold transition hover:-translate-y-0.5 hover:bg-ink hover:text-cream ${i === 0 ? "border-chili bg-chili text-cream" : "border-ink bg-cream"}`}
                >
                  {cuisineLabel(c)}
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="relative z-10 h-[380px] md:col-span-5 md:-ml-40 md:h-[720px]">
          <div className="blob shadow-warm absolute right-[-30px] top-0 h-[340px] w-[340px] overflow-hidden border-8 border-cream md:right-[-20px] md:top-6 md:h-[600px] md:w-[600px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={heroImages[0]} alt={t("heroAlt1")} className="h-full w-full scale-125 object-cover" />
          </div>
          <div className="arch shadow-warm absolute bottom-0 left-0 hidden h-[260px] w-[190px] -rotate-6 overflow-hidden border-8 border-cream bg-chili md:block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={heroImages[1] ?? heroImages[0]} alt={t("heroAlt2")} className="h-full w-full object-cover" />
          </div>

          <Stamp text={t("stamp")} className="absolute left-0 top-4 z-30 h-24 w-24 bg-chili text-cream md:left-10 md:top-0 md:h-32 md:w-32" />
          <span className="absolute right-[45%] top-[300px] z-30 -rotate-12 rounded-xl bg-herb px-3 py-1 font-display text-lg font-bold text-cream shadow-hard md:right-[52%] md:top-[300px]">{t("hotNow")}</span>
          {topRating > 0 && (
            <span className="absolute right-0 top-[-6px] z-30 grid h-16 w-16 rotate-12 place-items-center rounded-full border-4 border-cream bg-ink font-display text-lg font-extrabold text-saffron md:right-4 md:top-2 md:h-20 md:w-20 md:text-xl">★{topRating.toFixed(1)}</span>
          )}

          <div className="bob absolute -bottom-6 left-0 z-30 flex items-center gap-3 rounded-full bg-ink py-2 pl-2 pr-5 text-cream shadow-warm md:bottom-10 md:left-40">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={heroImages[2] ?? heroImages[0]} alt="" className="h-12 w-12 rounded-full object-cover md:h-14 md:w-14" />
            <div>
              <p className="flex items-center gap-2 text-sm text-saffron"><span className="h-2.5 w-2.5 animate-pulse rounded-full bg-herb" />{t("liveTracking")}</p>
              <p className="font-display text-lg font-bold md:text-xl">{t("followOrder")}</p>
            </div>
          </div>
          <Arrow className="absolute bottom-24 left-24 z-30 hidden h-16 w-20 -scale-x-100 text-chili md:block" />
        </div>
      </div>
    </section>
  );
}
