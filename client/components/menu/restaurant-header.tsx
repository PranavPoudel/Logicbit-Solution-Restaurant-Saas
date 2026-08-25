// components/menu/restaurant-header.tsx
import { Star, Clock } from "lucide-react";
import type { RestaurantDetail } from "@/types/menu";

export function RestaurantHeader({ restaurant }: { restaurant: RestaurantDetail }) {
  const name = restaurant.name ?? "Restaurant";
  const cuisines = restaurant.cuisines ?? [];
  const rating = typeof restaurant.avgRating === "number" ? restaurant.avgRating : null;
  const isOpen = restaurant.isOpen !== false;

  return (
    <div>
      <div className="relative h-40 sm:h-56 bg-gradient-to-br from-[#17181C] to-[#2B2D33]">
        {restaurant.coverImageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={restaurant.coverImageUrl}
            alt={name}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
      </div>

      <div className="max-w-4xl mx-auto px-4">
        <div className="relative -mt-10 flex items-end gap-4">
          <div className="w-20 h-20 rounded-2xl bg-white border-4 border-white shadow-md overflow-hidden shrink-0 flex items-center justify-center">
            {restaurant.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={restaurant.logoUrl} alt={name} className="w-full h-full object-cover" />
            ) : (
              <span className="font-display text-2xl text-[#17181C]">{name.charAt(0)}</span>
            )}
          </div>
        </div>

        <div className="mt-3 pb-5 border-b border-[#E8E7E2]">
          <h1 className="font-display font-semibold text-2xl text-[#17181C]">{name}</h1>

          <div className="flex flex-wrap items-center gap-2 mt-2">
            {cuisines.length > 0 ? (
              // ✅ FIX: Map over objects and extract .name and .id/.slug
              cuisines.map((c: any) => (
                <span
                  key={c.id || c.slug}
                  className="text-[11px] font-medium text-[#0F6B5C] bg-[#0F6B5C]/8 px-2 py-0.5 rounded-full"
                >
                  {c.name}
                </span>
              ))
            ) : (
              <span className="text-[11px] text-neutral-300">—</span>
            )}
          </div>

          <div className="flex items-center gap-3 mt-3 font-mono text-xs text-neutral-500">
            {rating !== null && (
              <span className="flex items-center gap-1 text-[#17181C]">
                <Star size={12} className="fill-[#E3A008] text-[#E3A008]" />
                {rating.toFixed(1)}
              </span>
            )}
            {restaurant.estimatedDeliveryMinutes && (
              <span className="flex items-center gap-1">
                <Clock size={12} />
                {restaurant.estimatedDeliveryMinutes} min
              </span>
            )}
            {restaurant.distanceKm !== undefined && (
              <span>{restaurant.distanceKm.toFixed(1)} km away</span>
            )}
            <span
              className={`ml-auto text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-md ${
                isOpen ? "bg-[#0F6B5C]/10 text-[#0F6B5C]" : "bg-neutral-100 text-neutral-500"
              }`}
            >
              {isOpen ? "Open now" : "Closed"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}