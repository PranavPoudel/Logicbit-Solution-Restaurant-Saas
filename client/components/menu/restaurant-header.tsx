// components/menu/restaurant-header.tsx
import { Star, Clock } from "lucide-react";
import type { RestaurantDetail } from "@/types/menu";
import { theme } from "@/config/theme";

export function RestaurantHeader({ restaurant }: { restaurant: RestaurantDetail }) {
  const name = restaurant.name ?? "Restaurant";
  const cuisines = restaurant.cuisines ?? [];
  const rating = typeof restaurant.avgRating === "number" ? restaurant.avgRating : null;
  const isOpen = restaurant.isOpen !== false;

  return (
    <div>
      <div
        className="relative h-40 sm:h-56"
        style={{
          background: `linear-gradient(to bottom right, ${theme.colors.darkGradientStart}, ${theme.colors.dark})`,
        }}
      >
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
        <div
          className="absolute inset-0"
          style={{ background: `linear-gradient(to top, ${theme.colors.dark}99, transparent)` }}
        />
      </div>

      <div className="max-w-4xl mx-auto px-4">
        <div className="relative -mt-10 flex items-end gap-4">
          <div
            className="w-20 h-20 rounded-2xl shadow-md overflow-hidden shrink-0 flex items-center justify-center"
            style={{
              backgroundColor: theme.colors.background,
              border: `4px solid ${theme.colors.background}`,
              boxShadow: `0 0 0 1px ${theme.colors.primary}33`,
            }}
          >
            {restaurant.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={restaurant.logoUrl} alt={name} className="w-full h-full object-cover" />
            ) : (
              <span className="font-serif text-2xl" style={{ color: theme.colors.dark }}>
                {name.charAt(0)}
              </span>
            )}
          </div>
        </div>

        <div className="mt-3 pb-5" style={{ borderBottom: `1px solid ${theme.colors.dark}1A` }}>
          <h1 className="font-serif font-semibold text-2xl" style={{ color: theme.colors.dark }}>
            {name}
          </h1>

          <div className="flex flex-wrap items-center gap-2 mt-2">
            {cuisines.length > 0 ? (
              cuisines.map((c: any) => (
                <span
                  key={c.id || c.slug}
                  className="text-[11px] font-medium px-2 py-0.5 rounded-full"
                  style={{ color: theme.colors.primary, backgroundColor: `${theme.colors.primary}14` }}
                >
                  {c.name}
                </span>
              ))
            ) : (
              <span className="text-[11px]" style={{ color: `${theme.colors.dark}4D` }}>—</span>
            )}
          </div>

          <div className="flex items-center gap-3 mt-3 font-mono text-xs" style={{ color: `${theme.colors.dark}8C` }}>
            {rating !== null && (
              <span className="flex items-center gap-1" style={{ color: theme.colors.dark }}>
                <Star size={12} style={{ fill: theme.colors.ratingGold, color: theme.colors.ratingGold }} />
                {rating.toFixed(1)}
              </span>
            )}
            {restaurant.estimatedDeliveryMinutes && (
              <span className="flex items-center gap-1">
                <Clock size={12} />
                {restaurant.estimatedDeliveryMinutes} {theme.content.minutesSuffix}
              </span>
            )}
            {restaurant.distanceKm !== undefined && (
              <span>{restaurant.distanceKm.toFixed(1)} {theme.content.distanceAwaySuffix}</span>
            )}
            <span
              className="ml-auto text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-md"
              style={{
                backgroundColor: isOpen ? `${theme.colors.statusOpenBg}1F` : `${theme.colors.dark}14`,
                color: isOpen ? theme.colors.statusOpenText : `${theme.colors.dark}80`,
              }}
            >
              {isOpen ? theme.content.openNowLabel : theme.content.closedLabel}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}