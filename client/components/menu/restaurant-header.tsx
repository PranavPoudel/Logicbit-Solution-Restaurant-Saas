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
      <div className="relative h-40 sm:h-56 bg-gradient-to-br from-[#5C1810] to-[#2B1410]">
        {restaurant.coverImageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={restaurant.coverImageUrl}
            alt={name}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#2B1410]/60 to-transparent" />
      </div>

      <div className="max-w-4xl mx-auto px-4">
        <div className="relative -mt-10 flex items-end gap-4">
          <div className="w-20 h-20 rounded-2xl bg-[#FDF6EC] border-4 border-[#FDF6EC] shadow-md overflow-hidden shrink-0 flex items-center justify-center ring-1 ring-[#C0392B]/20">
            {restaurant.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={restaurant.logoUrl} alt={name} className="w-full h-full object-cover" />
            ) : (
              <span className="font-serif text-2xl text-[#2B1410]">{name.charAt(0)}</span>
            )}
          </div>
        </div>

        <div className="mt-3 pb-5 border-b border-[#2B1410]/10">
          <h1 className="font-serif font-semibold text-2xl text-[#2B1410]">{name}</h1>

          <div className="flex flex-wrap items-center gap-2 mt-2">
            {cuisines.length > 0 ? (
              cuisines.map((c: any) => (
                <span
                  key={c.id || c.slug}
                  className="text-[11px] font-medium text-[#C0392B] bg-[#C0392B]/8 px-2 py-0.5 rounded-full"
                >
                  {c.name}
                </span>
              ))
            ) : (
              <span className="text-[11px] text-[#2B1410]/30">—</span>
            )}
          </div>

          <div className="flex items-center gap-3 mt-3 font-mono text-xs text-[#2B1410]/55">
            {rating !== null && (
              <span className="flex items-center gap-1 text-[#2B1410]">
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
                isOpen
                  ? "bg-[#5B8C5A]/12 text-[#3E6B3D]"
                  : "bg-[#2B1410]/8 text-[#2B1410]/50"
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