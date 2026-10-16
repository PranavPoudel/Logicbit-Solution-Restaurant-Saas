// components/restaurant/restaurant-card.tsx
"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useFavorite } from "@/hooks/use-favorite";
import { cuisineName, restaurantImage } from "@/lib/utils/cuisine";
import { useCuisineLabel } from "@/hooks/use-cuisine-label";
import type { DiscoveryRestaurant } from "@/types/restaurant";
import { Badge, Icon, IconButton } from "@/components/ui/primitives";

const TINTS = [
  { bg: "bg-saffron", text: "text-ink" },
  { bg: "bg-chili", text: "text-cream" },
  { bg: "bg-herb", text: "text-cream" },
];
const ROTS = ["-rotate-2", "rotate-2", "-rotate-1", "rotate-1"];

export function RestaurantCard({ r, index, compact }: { r: DiscoveryRestaurant; index: number; compact?: boolean }) {
  const t = useTranslations("restaurant");
  const tc = useTranslations("common");
  const cuisineLabel = useCuisineLabel();
  const tint = TINTS[index % TINTS.length];
  const open = r.isOpen !== false;
  const rating = r.avgRating ?? 0;
  const name = r.name ?? t("fallbackName");
  const href = `/restaurants/${r.slug ?? r.id}`;

  const { fav, toggle } = useFavorite(r.id);

  return (
    <article className={`${ROTS[index % ROTS.length]} group relative rounded-[28px] bg-paper p-3 pb-5 shadow-warm transition hover:-translate-y-1 hover:rotate-0`}>
      <div className="relative aspect-[4/3] overflow-hidden rounded-[20px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={restaurantImage(r)} alt={t("foodFrom", { name })} className={`h-full w-full object-cover transition duration-500 group-hover:scale-105 ${open ? "" : "opacity-70 grayscale"}`} />
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          <Badge tone={open ? "herb" : "ink"}>
            <span className={`h-2.5 w-2.5 rounded-full ${open ? "animate-pulse bg-parchment" : "bg-chili"}`} />
            {open ? tc("openNow") : tc("closed")}
          </Badge>
        </div>
        <IconButton
          icon="heart"
          label={fav ? t("removeFav", { name }) : t("saveFav", { name })}
          aria-pressed={fav}
          onClick={toggle}
          className={`shadow-soft absolute bottom-3 right-3 z-10 ${fav ? "bg-chili text-parchment" : "bg-parchment text-espresso"}`}
        />
      </div>

      {r.isSponsored && <span className="absolute -left-3 top-6 z-10 -rotate-12 rounded-xl bg-ink px-3 py-1 font-display text-base font-extrabold text-cream shadow-hard">{t("sponsored")}</span>}
      <div className={`${tint.bg} ${tint.text} absolute -right-4 -top-5 z-10 grid h-20 w-20 rotate-12 place-items-center rounded-full border-4 border-paper font-display text-2xl font-extrabold shadow-hard`}>
        {rating > 0 ? `★${rating.toFixed(1)}` : t("new")}
      </div>

      <div className={`px-2 pt-4 ${open ? "" : "opacity-75"}`}>
        <h3 className="font-display text-2xl font-bold leading-tight">
          <Link href={href} className="text-left after:absolute after:inset-0 after:rounded-[28px] focus-visible:outline-none focus-visible:after:ring-4 focus-visible:after:ring-saffron">
            {name}
          </Link>
        </h3>
        <div className="mt-2 flex flex-wrap gap-2">
          {(r.cuisines ?? []).map((c) => (
            <span key={cuisineName(c)} className="rounded-full bg-ink/10 px-3 py-1 font-bold">{cuisineLabel(c)}</span>
          ))}
        </div>
        <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-ink/75">
          {r.estimatedDeliveryMinutes != null && (
            <span className="flex items-center gap-1.5"><Icon name="clock" className="h-4 w-4" />{t("minutes", { count: r.estimatedDeliveryMinutes })}</span>
          )}
          {r.distanceKm != null && (
            <span className="flex items-center gap-1.5"><Icon name="pin" className="h-4 w-4" />{t("km", { value: r.distanceKm })}</span>
          )}
          {r.city && <span className="flex items-center gap-1.5"><Icon name="store" className="h-4 w-4" />{r.city}</span>}
        </p>
        {!compact && (
          <div className="relative z-10 mt-4 flex items-center justify-end">
            <Link href={href} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-chili px-5 font-bold text-parchment shadow-red transition hover:-translate-y-0.5">
              {t("viewMenu")}
              <Icon name="arrow" className="h-5 w-5" />
            </Link>
          </div>
        )}
      </div>
    </article>
  );
}
