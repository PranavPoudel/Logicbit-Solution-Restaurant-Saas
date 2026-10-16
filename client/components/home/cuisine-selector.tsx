// components/home/cuisine-selector.tsx
"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { byCuisineOrder, cuisineImage, cuisineSlug } from "@/lib/utils/cuisine";
import { useCuisineLabel } from "@/hooks/use-cuisine-label";
import type { Cuisine } from "@/lib/api/cuisines";

const MOODS = [
  { icon: "✺", bg: "bg-chili text-cream", rot: "-rotate-1" },
  { icon: "◐", bg: "bg-saffron text-ink", rot: "rotate-1" },
  { icon: "❀", bg: "bg-blush text-ink", rot: "-rotate-1" },
  { icon: "➤", bg: "bg-ink text-saffron", rot: "rotate-1" },
  { icon: "✿", bg: "bg-herb text-cream", rot: "-rotate-1" },
  { icon: "◉", bg: "bg-tangerine text-ink", rot: "rotate-1" },
];

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
        {byCuisineOrder(cuisines).map((c, i) => {
          const m = MOODS[i % MOODS.length];
          return (
            <Link
              key={c.id}
              href={`/restaurants?cuisine=${encodeURIComponent(c.slug ?? c.name)}`}
              className={`${m.bg} ${m.rot} group relative flex min-h-[120px] shrink-0 snap-start items-center gap-4 overflow-hidden rounded-[36px] py-4 pl-6 pr-4 text-left shadow-warm transition hover:-translate-y-1`}
            >
              <span className="text-4xl" aria-hidden>{m.icon}</span>
              <span className="font-display text-4xl font-extrabold md:text-5xl">{cuisineLabel(c)}</span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={cuisineImage(cuisineSlug(c))} alt="" className="blob h-24 w-24 object-cover transition group-hover:rotate-12" />
            </Link>
          );
        })}
      </div>
    </section>
  );
}
