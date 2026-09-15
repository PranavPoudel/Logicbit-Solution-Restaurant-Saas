// components/restaurant/restaurant-card.tsx
"use client";

import Link from "next/link";
import { Star, Heart } from "lucide-react";
import { useState } from "react";
import type { DiscoveryRestaurant } from "@/types/restaurant";
import { theme } from "@/config/theme";

export function RestaurantCard({ restaurant }: { restaurant: DiscoveryRestaurant }) {
  const [isFavorited, setIsFavorited] = useState(false);

  // Defensive fallbacks
  const name = restaurant.name ?? "Restaurant";
  const cuisines = restaurant.cuisines ?? [];
  const rating = typeof restaurant.avgRating === "number" ? restaurant.avgRating : null;
  const distanceKm = typeof restaurant.distanceKm === "number" ? restaurant.distanceKm : null;
  const slug = restaurant.slug ?? restaurant.id;
  const isOpen = restaurant.isOpen !== false;

  return (
    <Link
      href={`/restaurants/${slug}`}
      className="group block bg-white rounded-2xl overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all"
      style={{ border: `1px solid ${theme.colors.dark}14` }}
    >
      <div className="relative aspect-[4/3] overflow-hidden" style={{ backgroundColor: `${theme.colors.dark}0D` }}>
        {restaurant.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={restaurant.coverImageUrl}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              // Fallback if image URL is broken
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center font-serif text-4xl"
            style={{ backgroundColor: theme.colors.dark, color: `${theme.colors.background}33` }}
          >
            {name.charAt(0)}
          </div>
        )}

        <div
          className="absolute inset-0"
          style={{ background: `linear-gradient(to bottom, ${theme.colors.dark}40, transparent, transparent)` }}
        />

        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-start justify-between">
          <span
            className="text-[10px] font-mono font-bold uppercase tracking-wide px-2 py-1 rounded-md"
            style={{
              backgroundColor: isOpen ? theme.colors.statusOpenBg : `${theme.colors.dark}99`,
              color: theme.colors.background,
            }}
          >
            {isOpen ? theme.content.openLabelShort : theme.content.closedLabel}
          </span>

          <button
            onClick={(e) => {
              e.preventDefault();
              setIsFavorited((v) => !v);
            }}
            aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
            className="w-7 h-7 rounded-full backdrop-blur flex items-center justify-center transition-colors"
            style={{ backgroundColor: `${theme.colors.background}E6` }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = theme.colors.background)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = `${theme.colors.background}E6`)}
          >
            <Heart
              size={14}
              style={{
                fill: isFavorited ? theme.colors.primary : "none",
                color: isFavorited ? theme.colors.primary : `${theme.colors.dark}66`,
              }}
            />
          </button>
        </div>

        {restaurant.isSponsored && (
          <span
            className="absolute bottom-2.5 left-2.5 text-[10px] font-mono font-bold uppercase tracking-wide px-2 py-1 rounded-md"
            style={{ backgroundColor: theme.colors.primary, color: theme.colors.background }}
          >
            {theme.content.sponsoredLabel}
          </span>
        )}

        {rating !== null && (
          <span
            className="absolute bottom-2.5 right-2.5 flex items-center gap-1 backdrop-blur text-xs font-mono font-semibold px-2 py-1 rounded-md"
            style={{ backgroundColor: `${theme.colors.background}F2`, color: theme.colors.dark }}
          >
            <Star size={11} style={{ fill: theme.colors.primary, color: theme.colors.primary }} />
            {rating.toFixed(1)}
          </span>
        )}
      </div>

      <div className="p-3.5">
        <h3 className="font-serif font-semibold text-[15px] leading-tight truncate" style={{ color: theme.colors.dark }}>
          {name}
        </h3>

        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
          {cuisines.length > 0 ? (
            cuisines.slice(0, 3).map((cuisine: any) => (
              <span
                key={cuisine.id || cuisine.slug}
                className="text-[11px] font-medium px-2 py-0.5 rounded-full truncate"
                style={{ color: theme.colors.primary, backgroundColor: `${theme.colors.primary}14` }}
              >
                {cuisine.name}
              </span>
            ))
          ) : (
            <span className="text-[11px]" style={{ color: `${theme.colors.dark}40` }}>—</span>
          )}
        </div>

        <div className="flex items-center gap-2.5 mt-2.5 font-mono text-[11px]" style={{ color: `${theme.colors.dark}80` }}>
          {distanceKm !== null && <span>{distanceKm.toFixed(1)} {theme.content.distanceAwaySuffix}</span>}
          {restaurant.estimatedDeliveryMinutes && (
            <>
              <span style={{ color: `${theme.colors.dark}40` }}>·</span>
              <span>{restaurant.estimatedDeliveryMinutes} {theme.content.minutesSuffix}</span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}