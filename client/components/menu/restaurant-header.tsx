// components/menu/restaurant-header.tsx
import { Star, Clock } from "lucide-react";
import type { RestaurantDetail } from "@/types/menu";
import { theme } from "@/config/theme";
import { cuisineList } from "@/lib/utils/cuisine";
import { AppImage } from "@/components/ui/app-image";

export function RestaurantHeader({ restaurant }: { restaurant: RestaurantDetail }) {
  const name = restaurant.name ?? "Restaurant";
  const cuisines = cuisineList(restaurant.cuisines);
  const rating = typeof restaurant.avgRating === "number" ? restaurant.avgRating : null;
  const isOpen = restaurant.isOpen !== false;

  return (
    <div>
      <div
        className="relative h-56 sm:h-96"
        style={{
          background: `linear-gradient(to bottom right, ${theme.colors.darkGradientStart}, ${theme.colors.dark})`,
        }}
      >
        {restaurant.coverImageUrl && (
          <AppImage
            sizes="100vw"
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

      <div className="max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12">
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
              <AppImage sizes="96px" src={restaurant.logoUrl} alt={name} className="w-full h-full object-cover" />
            ) : (
              <span className="font-serif text-2xl" style={{ color: theme.colors.dark }}>
                {name.charAt(0)}
              </span>
            )}
          </div>
        </div>

        <div className="mt-3 pb-5" style={{ borderBottom: `1px solid ${theme.colors.dark}1A` }}>
          <h1 className="font-serif font-semibold text-3xl sm:text-4xl" style={{ color: theme.colors.dark }}>
            {name}
          </h1>

          <div className="flex flex-wrap items-center gap-2.5 mt-3">
            {cuisines.length > 0 ? (
              cuisines.map((c) => (
                <span
                  key={c.key}
                  className="text-sm font-medium px-3 py-1 rounded-full"
                  style={{ color: theme.colors.primary, backgroundColor: `${theme.colors.primary}14` }}
                >
                  {c.name}
                </span>
              ))
            ) : (
              <span className="text-sm" style={{ color: `${theme.colors.dark}4D` }}>—</span>
            )}
          </div>

          <div className="flex items-center gap-3 mt-4 font-mono text-base" style={{ color: `${theme.colors.dark}8C` }}>
            {rating !== null && (
              <span className="flex items-center gap-1" style={{ color: theme.colors.dark }}>
                <Star size={16} style={{ fill: theme.colors.ratingGold, color: theme.colors.ratingGold }} />
                {rating.toFixed(1)}
              </span>
            )}
            {restaurant.estimatedDeliveryMinutes && (
              <span className="flex items-center gap-1">
                <Clock size={16} />
                {restaurant.estimatedDeliveryMinutes} {theme.content.minutesSuffix}
              </span>
            )}
            {restaurant.distanceKm !== undefined && (
              <span>{restaurant.distanceKm.toFixed(1)} {theme.content.distanceAwaySuffix}</span>
            )}
            <span
              className="ml-auto text-xs font-bold uppercase tracking-wide px-3 py-1.5 rounded-md"
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