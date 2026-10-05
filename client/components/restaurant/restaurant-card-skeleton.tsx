// components/restaurant/restaurant-card-skeleton.tsx
import { theme } from "@/config/theme";

export function RestaurantCardSkeleton() {
  return (
    <div
      className="bg-white rounded-2xl overflow-hidden animate-pulse"
      style={{ border: `1px solid ${theme.colors.dark}14` }}
    >
      <div className="h-56 sm:h-60" style={{ backgroundColor: `${theme.colors.dark}0D` }} />
      <div className="p-3.5 space-y-2">
        <div className="h-4 rounded w-3/4" style={{ backgroundColor: `${theme.colors.dark}0D` }} />
        <div className="h-4 rounded-full w-1/3 mt-1.5" style={{ backgroundColor: `${theme.colors.dark}0D` }} />
        <div className="h-3 rounded w-2/3 mt-2.5" style={{ backgroundColor: `${theme.colors.dark}0D` }} />
      </div>
    </div>
  );
}