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
      <div className="no-scrollbar mt-6 flex snap-x gap-4 overflow-x-auto px-5 pb-6 md:px-10">
        {byCuisineOrder(cuisines).map((c, i, list) => (
          <Link
            key={c.id}
            href={`/restaurants?cuisine=${encodeURIComponent(c.slug ?? c.name)}`}
            style={{ background: shade(i, list.length) }}
            className={`${ROTS[i % ROTS.length]} group relative flex min-h-[120px] shrink-0 snap-start items-center gap-4 overflow-hidden rounded-[36px] py-4 pl-6 pr-4 text-left text-parchment shadow-warm transition hover:-translate-y-1`}
          >
            <span className="text-4xl" aria-hidden>{ICONS[i % ICONS.length]}</span>
            <span className="font-display text-4xl font-extrabold md:text-5xl">{cuisineLabel(c)}</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={cuisineImage(cuisineSlug(c))} alt="" className="h-24 w-24 rounded-2xl object-cover transition group-hover:rotate-6" />
          </Link>
        ))}
      </div>
    </section>
  );
}
