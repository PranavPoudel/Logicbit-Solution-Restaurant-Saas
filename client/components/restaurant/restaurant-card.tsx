"use client";

import Link from "next/link";
import { Star, Heart } from "lucide-react";
import { useState } from "react";
import type { DiscoveryRestaurant } from "@/types/restaurant";

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
      className="group block bg-white rounded-2xl border border-[#2B1410]/8 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all"
    >
      <div className="relative aspect-[4/3] bg-[#2B1410]/5 overflow-hidden">
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
          <div className="w-full h-full flex items-center justify-center bg-[#2B1410] text-[#FDF6EC]/20 font-serif text-4xl">
            {name.charAt(0)}
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-b from-[#2B1410]/25 via-transparent to-transparent" />

        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-start justify-between">
          <span
            className={`text-[10px] font-mono font-bold uppercase tracking-wide px-2 py-1 rounded-md ${
              isOpen ? "bg-[#5B8C5A] text-[#FDF6EC]" : "bg-[#2B1410]/60 text-[#FDF6EC]"
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
            className="w-7 h-7 rounded-full bg-[#FDF6EC]/90 backdrop-blur flex items-center justify-center hover:bg-[#FDF6EC] transition-colors"
          >
            <Heart
              size={14}
              className={isFavorited ? "fill-[#C0392B] text-[#C0392B]" : "text-[#2B1410]/40"}
            />
          </button>
        </div>

        {restaurant.isSponsored && (
          <span className="absolute bottom-2.5 left-2.5 bg-[#C0392B] text-[#FDF6EC] text-[10px] font-mono font-bold uppercase tracking-wide px-2 py-1 rounded-md">
            Sponsored
          </span>
        )}

        {rating !== null && (
          <span className="absolute bottom-2.5 right-2.5 flex items-center gap-1 bg-[#FDF6EC]/95 backdrop-blur text-[#2B1410] text-xs font-mono font-semibold px-2 py-1 rounded-md">
            <Star size={11} className="fill-[#C0392B] text-[#C0392B]" />
            {rating.toFixed(1)}
          </span>
        )}
      </div>

      <div className="p-3.5">
        <h3 className="font-serif font-semibold text-[#2B1410] text-[15px] leading-tight truncate">
          {name}
        </h3>

        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
          {cuisines.length > 0 ? (
            cuisines.slice(0, 3).map((cuisine: any) => (
              <span
                key={cuisine.id || cuisine.slug}
                className="text-[11px] font-medium text-[#C0392B] bg-[#C0392B]/8 px-2 py-0.5 rounded-full truncate"
              >
                {cuisine.name}
              </span>
            ))
          ) : (
            <span className="text-[11px] text-[#2B1410]/25">—</span>
          )}
        </div>

        <div className="flex items-center gap-2.5 mt-2.5 font-mono text-[11px] text-[#2B1410]/50">
          {distanceKm !== null && <span>{distanceKm.toFixed(1)} km away</span>}
          {restaurant.estimatedDeliveryMinutes && (
            <>
              <span className="text-[#2B1410]/25">·</span>
              <span>{restaurant.estimatedDeliveryMinutes} min</span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}