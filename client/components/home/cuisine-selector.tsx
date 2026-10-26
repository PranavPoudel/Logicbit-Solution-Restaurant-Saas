// components/home/cuisine-selector.tsx
"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { theme } from "@/config/theme";
import { byCuisineOrder, cuisineImage, cuisineSlug } from "@/lib/utils/cuisine";
import { useCuisineLabel } from "@/hooks/use-cuisine-label";
import type { Cuisine } from "@/lib/api/cuisines";

const ICONS = ["✺", "◐", "❀", "➤", "✿", "◉"];
const ROTS = ["-rotate-1", "rotate-1"];
const { edge, center } = theme.colors.cuisineShades;

const shade = (i: number, count: number) => {
  const mid = (count - 1) / 2;
  const far = mid === 0 ? 0 : Math.abs(i - mid) / mid;
  return `color-mix(in srgb, ${edge} ${Math.round(far * 100)}%, ${center})`;
};

export function CuisineSelector({ cuisines }: { cuisines: Cuisine[] }) {
  const t = useTranslations("home");
  const cuisineLabel = useCuisineLabel();
  if (cuisines.length === 0) return null;
  return (
    <section className="relative py-10" aria-labelledby="mood">
      <div className="mx-auto w-full max-w-[1440px] px-5 md:px-10">
        <h2 id="mood" className="font-display text-4xl font-extrabold tracking-tight md:text-6xl">
          {t("browseCuisine")}<span className="text-chili">.</span>
        </h2>
      </div>
      <div className="no-scrollbar mt-6 flex snap-x scroll-px-5 gap-4 overflow-x-auto px-5 pb-6 md:scroll-px-10 md:px-10 lg:gap-3 lg:overflow-visible">
        {byCuisineOrder(cuisines).map((c, i, list) => (
          <Link
            key={c.id}
            href={`/restaurants?cuisine=${encodeURIComponent(c.slug ?? c.name)}`}
            style={{ background: shade(i, list.length) }}
            className={`${ROTS[i % ROTS.length]} group relative isolate flex min-h-[96px] md:min-h-[120px] shrink-0 snap-start items-center gap-4 overflow-hidden rounded-[36px] py-3 pl-5 pr-5 md:py-4 md:pl-6 md:pr-4 lg:min-h-[104px] lg:min-w-0 lg:flex-1 lg:shrink lg:justify-center lg:gap-2 lg:rounded-[28px] lg:px-2 xl:px-3 text-left text-parchment shadow-warm transition hover:-translate-y-1`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={cuisineImage(cuisineSlug(c))} alt="" className="absolute inset-0 -z-10 h-full w-full object-cover opacity-30 transition duration-500 group-hover:scale-110 group-hover:opacity-40" />
            <span className="text-3xl md:text-4xl lg:hidden 2xl:block 2xl:text-2xl" aria-hidden>{ICONS[i % ICONS.length]}</span>
            <span className="font-display text-3xl font-extrabold [text-shadow:0_1px_6px_rgba(60,0,15,.6)] md:text-5xl lg:whitespace-nowrap lg:text-[clamp(1.125rem,1.7vw,2rem)]">{cuisineLabel(c)}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
