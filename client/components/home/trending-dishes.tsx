// components/home/trending-dishes.tsx
"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { theme } from "@/config/theme";
import { money } from "@/lib/utils/money";

export type TrendingDish = { id: string; name: string; price: number; image?: string | null; restaurant: string; slug: string };

const COLORS = ["text-chili", "text-saffron", "text-herb"];

export function TrendingDishes({ dishes }: { dishes: TrendingDish[] }) {
  const t = useTranslations("home");
  if (dishes.length === 0) return null;
  return (
    <section id="trending" className="mx-auto w-full max-w-[1440px] px-5 py-24 md:px-10">
      <p className="font-bold uppercase tracking-widest text-chili">{t("trendingKicker")}</p>
      <h2 className="font-display text-5xl font-extrabold tracking-tight md:text-7xl">{t("trendingTitle")}</h2>
      <div className="mt-12 grid gap-16 md:grid-cols-3 md:gap-8">
        {dishes.map((d, i) => (
          <div key={d.id} className={`relative ${i === 1 ? "md:mt-20" : ""}`}>
            <span className={`font-display absolute -top-16 left-0 select-none text-[220px] font-extrabold leading-none opacity-90 ${COLORS[i % 3]}`} aria-hidden>{i + 1}</span>
            <div className="relative ml-16 mt-16">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={d.image || theme.brand.fallbackImage} alt={d.name} className={`${i === 1 ? "arch" : "blob"} shadow-warm aspect-square w-full object-cover`} />
              <Link href={`/restaurants/${d.slug}?item=${d.id}`} className="absolute -bottom-4 right-4 inline-flex min-h-12 items-center rounded-full bg-ink px-5 font-bold text-cream shadow-hard hover:bg-chili">
                {t("addPrice", { price: money(d.price) })}
              </Link>
            </div>
            <div className="ml-16 mt-8">
              <h3 className="font-display text-3xl font-bold">{d.name}</h3>
              <p className="text-ink/70">{t("fromRestaurant", { restaurant: d.restaurant })}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
