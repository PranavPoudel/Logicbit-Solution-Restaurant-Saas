// components/restaurant/restaurant-card.tsx
"use client";

import Link from "next/link";
import { Star, Heart } from "lucide-react";
import { useState } from "react";
import type { DiscoveryRestaurant } from "@/types/restaurant";

export function RestaurantCard({ restaurant }: { restaurant: DiscoveryRestaurant }) {
  const [isFavorited, setIsFavorited] = useState(false);

  // Defensive fallbacks — real API field names aren't confirmed for every
  // field yet, so a missing one degrades gracefully instead of crashing
  // the whole grid.
  const name = restaurant.name ?? "Restaurant";
  const cuisines = restaurant.cuisines ?? [];
  const rating = typeof restaurant.avgRating === "number" ? restaurant.avgRating : null;
  const distanceKm =
    typeof restaurant.distanceKm === "number" ? restaurant.distanceKm : null;
  const slug = restaurant.slug ?? restaurant.id;
  const isOpen = restaurant.isOpen !== false; // default to open unless explicitly false

  return (
    <Link
      href={`/restaurants/${slug}`}
      className="group block bg-white rounded-2xl border border-[#E8E7E2] overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all"
    >
      <div className="relative aspect-[4/3] bg-neutral-100 overflow-hidden">
        {restaurant.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={restaurant.coverImageUrl}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#17181C] to-[#2B2D33] text-white/20 font-display text-4xl">
            {name.charAt(0)}
          </div>
        )}

        {/* dark gradient for badge legibility, reference-style */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-transparent" />

        {/* top row: OPEN/CLOSED status pill + favorite heart */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-start justify-between">
          <span
            className={`text-[10px] font-mono font-bold uppercase tracking-wide px-2 py-1 rounded-md ${
              isOpen ? "bg-[#0F6B5C] text-white" : "bg-neutral-700 text-white"
            }`}
          >
            {isOpen ? "Open" : "Closed"}
          </span>

          <button
            onClick={(e) => {
              e.preventDefault();
              setIsFavorited((v) => !v);
            }}
            aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
            className="w-7 h-7 rounded-full bg-white/90 backdrop-blur flex items-center justify-center hover:bg-white transition-colors"
          >
            <Heart
              size={14}
              className={isFavorited ? "fill-red-500 text-red-500" : "text-neutral-500"}
            />
          </button>
        </div>

        {restaurant.isSponsored && (
          <span className="absolute bottom-2.5 left-2.5 bg-[#E3A008] text-[#17181C] text-[10px] font-mono font-bold uppercase tracking-wide px-2 py-1 rounded-md">
            Sponsored
          </span>
        )}

        {/* floating rating chip, bottom-right — reference-style overlay badge */}
        {rating !== null && (
          <span className="absolute bottom-2.5 right-2.5 flex items-center gap-1 bg-white/95 backdrop-blur text-[#17181C] text-xs font-mono font-semibold px-2 py-1 rounded-md">
            <Star size={11} className="fill-[#E3A008] text-[#E3A008]" />
            {rating.toFixed(1)}
          </span>
        )}
      </div>

      <div className="p-3.5">
        <h3 className="font-display font-semibold text-[#17181C] text-[15px] leading-tight truncate">
          {name}
        </h3>

        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
          {cuisines.length > 0 ? (
            cuisines.slice(0, 3).map((cuisine) => (
              <span
                key={cuisine}
                className="text-[11px] font-medium text-[#0F6B5C] bg-[#0F6B5C]/8 px-2 py-0.5 rounded-full truncate"
              >
                {cuisine}
              </span>
            ))
          ) : (
            <span className="text-[11px] text-neutral-300">—</span>
          )}
        </div>

        <div className="flex items-center gap-2.5 mt-2.5 font-mono text-[11px] text-neutral-500">
          {distanceKm !== null && <span>{distanceKm.toFixed(1)} km away</span>}
          {restaurant.estimatedDeliveryMinutes && (
            <>
              <span className="text-neutral-300">·</span>
              <span>{restaurant.estimatedDeliveryMinutes} min</span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}
