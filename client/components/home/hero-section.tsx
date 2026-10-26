// components/home/hero-section.tsx
"use client";

import { useState, type CSSProperties } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Icon } from "@/components/ui/primitives";
import { theme } from "@/config/theme";
import { byCuisineOrder } from "@/lib/utils/cuisine";
import { useCuisineLabel } from "@/hooks/use-cuisine-label";
import type { Cuisine } from "@/lib/api/cuisines";

const textWidth = (text: string) => [...text].reduce((sum, ch) => sum + (ch.charCodeAt(0) > 0x2e80 ? 1 : 0.55), 0);

export function HeroSection({ cuisines, openCount, topRating, city }: { cuisines: Cuisine[]; openCount: number; topRating: number; city?: string }) {
  const t = useTranslations("home");
  const locale = useLocale();
  const { heroImages } = theme.brand;
  const cuisineLabel = useCuisineLabel();
  const router = useRouter();
  const [q, setQ] = useState("");
  const chips = byCuisineOrder(cuisines).slice(0, 5);
  const split = city ? Math.max(1, Math.floor(city.length / 2)) : 0;
  const width = Math.max(textWidth((city ?? "") + t("heroC")), textWidth(t("heroD") + t("heroE")));

  const search = (value: string) => router.push(value ? `/restaurants?q=${encodeURIComponent(value)}` : "/restaurants");

  return (
    <section className="mx-auto w-full max-w-[1440px] px-5 pb-12 pt-4 md:px-10 md:pt-8">
      <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-12">
        <div>
          <span className="inline-flex -rotate-2 items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-bold text-cream">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-herb motion-reduce:animate-none" />
            {openCount > 0 ? t("openRight", { count: openCount }) : t("openSoon")}
          </span>
          <h1
            style={{ "--w": width } as CSSProperties}
            className={`font-display mt-6 whitespace-nowrap font-extrabold tracking-[-0.05em] ${locale === "ja" ? "leading-[1.1]" : "leading-[0.85]"} [font-size:min(17vw,calc((100vw-40px)/var(--w)))] md:[font-size:min(176px,calc((100vw-80px)/var(--w)))] lg:[font-size:min(176px,calc((min(100vw,1440px)-128px)/(2*var(--w))))]`}
          >
            {city ? (
              <>
                <span className="block">
                  {city.slice(0, split)}<span className="text-chili">{city.slice(split)}</span>{t("heroC")}
                </span>
                <span className="inline-block">
                  {t("heroD")}<span className="text-chili">{t("heroE")}</span>
                </span>
              </>
            ) : (
              t("heroNoCity")
            )}
          </h1>
          <p className="mt-8 max-w-md text-lg leading-relaxed">{t.rich("heroBody", { b: (chunks) => <b>{chunks}</b>, city: city ?? t("yourArea") })}</p>

          <form
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              search(q.trim());
            }}
            className="shadow-hard mt-8 flex max-w-xl items-center gap-2 rounded-full border-[3px] border-ink bg-paper p-1.5 pl-4"
          >
            <Icon name="search" className="h-5 w-5 shrink-0 text-ink/60" />
            <label htmlFor="home-search" className="sr-only">{t("searchLabel")}</label>
            <input id="home-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("searchPlaceholder")} className="min-h-11 min-w-0 flex-1 text-ellipsis bg-transparent text-base outline-none placeholder:text-ink/60" />
            <button type="submit" className="min-h-11 shrink-0 rounded-full bg-chili px-5 font-bold text-cream transition hover:bg-ink">{t("findFood")}</button>
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

        <div className="relative mx-auto aspect-square w-full max-w-[420px] sm:max-w-[520px] lg:ml-auto lg:mr-0 lg:max-w-[600px]">
          <div className="shadow-warm absolute inset-0 rotate-2 overflow-hidden rounded-[40px] border-8 border-cream">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={heroImages[0]} alt={t("heroAlt1")} fetchPriority="high" className="h-full w-full scale-110 object-cover" />
          </div>
          <div className="shadow-warm absolute -bottom-4 -left-3 hidden h-[38%] w-[28%] -rotate-6 overflow-hidden rounded-[28px] border-8 border-cream bg-chili sm:block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={heroImages[1] ?? heroImages[0]} alt={t("heroAlt2")} className="h-full w-full object-cover" />
          </div>
          {topRating > 0 && (
            <span className="absolute -right-1 -top-1 z-30 grid h-16 w-16 rotate-12 place-items-center rounded-full border-4 border-cream bg-ink font-display text-lg font-extrabold text-saffron md:h-20 md:w-20 md:text-xl">★{topRating.toFixed(1)}</span>
          )}
        </div>
      </div>
    </section>
  );
}
