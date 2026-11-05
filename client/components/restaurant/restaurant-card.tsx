// components/restaurant/restaurant-card.tsx
"use client";

import Link from "next/link";
import { Star, Heart, MapPin, Clock } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { DiscoveryRestaurant } from "@/types/restaurant";
import { theme } from "@/config/theme";
import { cuisineList } from "@/lib/utils/cuisine";
import { AppImage } from "@/components/ui/app-image";
import { favoritesApi } from "@/lib/api/customers";
import { useCustomerAuthStore } from "@/store/customer-auth-store";
import { useRequireLogin } from "@/hooks/use-require-login";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1595917248955-a96ace4780b6?q=80&w=1169&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";

export function RestaurantCard({ restaurant }: { restaurant: DiscoveryRestaurant }) {
  const queryClient = useQueryClient();
  const requireLogin = useRequireLogin();
  const isAuthenticated = useCustomerAuthStore((s) => s.isAuthenticated);

  const { data: favorites } = useQuery({
    queryKey: ["my-favorites"],
    queryFn: () => favoritesApi.list() as Promise<{ restaurantId: string }[]>,
    enabled: isAuthenticated,
  });
  const isFavorited = !!favorites?.some((f) => f.restaurantId === restaurant.id);

  const toggleFavorite = useMutation({
    mutationFn: () => (isFavorited ? favoritesApi.remove(restaurant.id) : favoritesApi.add(restaurant.id)),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["my-favorites"] }),
  });

  // Defensive fallbacks
  const name = restaurant.name ?? "Restaurant";
  const cuisines = cuisineList(restaurant.cuisines);
  const rating = typeof restaurant.avgRating === "number" ? restaurant.avgRating : null;
  const distanceKm = typeof restaurant.distanceKm === "number" ? restaurant.distanceKm : null;
  const slug = restaurant.slug ?? restaurant.id;
  const isOpen = restaurant.isOpen !== false;

  return (
    <Link
      href={`/restaurants/${slug}`}
      className="group block bg-white rounded-2xl overflow-hidden hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all"
      style={{ border: `1px solid ${theme.colors.dark}1F` }}
    >
      <div className="relative h-52 sm:h-56 overflow-hidden" style={{ backgroundColor: `${theme.colors.dark}0D` }}>
        <AppImage
          sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
          src={restaurant.coverImageUrl || FALLBACK_IMAGE}
          alt={name}
          className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${
            isOpen ? "" : "grayscale opacity-70"
          }`}
          onError={(e) => {
            // Fallback if image URL is broken
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />

        <div
          className="absolute inset-0"
          style={{ background: `linear-gradient(to bottom, ${theme.colors.dark}40, transparent, transparent)` }}
        />

        <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
          <span
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide px-2.5 py-1 rounded-full"
            style={{
              backgroundColor: isOpen ? theme.colors.statusOpenBg : `${theme.colors.dark}CC`,
              color: theme.colors.background,
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: isOpen ? "#B9F6B0" : "#FF9A8F" }}
            />
            {isOpen ? theme.content.openLabelShort : theme.content.closedLabel}
          </span>

          <button
            onClick={(e) => {
              e.preventDefault();
              if (requireLogin()) toggleFavorite.mutate();
            }}
            aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
            className="w-10 h-10 rounded-full backdrop-blur flex items-center justify-center transition-colors shadow-sm"
            style={{ backgroundColor: `${theme.colors.background}F2` }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#FFFFFF")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = `${theme.colors.background}F2`)}
          >
            <Heart
              size={20}
              style={{
                fill: isFavorited ? theme.colors.primary : "none",
                color: isFavorited ? theme.colors.primary : `${theme.colors.dark}99`,
              }}
            />
          </button>
        </div>

        {restaurant.isSponsored && (
          <span
            className="absolute bottom-3 left-3 text-xs font-mono font-bold uppercase tracking-wide px-2.5 py-1 rounded-full"
            style={{ backgroundColor: theme.colors.primary, color: theme.colors.background }}
          >
            {theme.content.sponsoredLabel}
          </span>
        )}

        {rating !== null && (
          <span
            className="absolute bottom-3 right-3 flex items-center gap-1 backdrop-blur text-sm font-mono font-bold px-2.5 py-1 rounded-full"
            style={{ backgroundColor: `${theme.colors.background}F7`, color: theme.colors.dark }}
          >
            <Star size={15} style={{ fill: theme.colors.ratingGold, color: theme.colors.ratingGold }} />
            {rating.toFixed(1)}
          </span>
        )}
      </div>

      <div className="p-3.5">
        <h3
          className="font-serif font-bold text-lg leading-tight truncate"
          style={{ color: theme.colors.dark }}
        >
          {name}
        </h3>

        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
          {cuisines.length > 0 ? (
            cuisines.slice(0, 3).map((cuisine) => (
              <span
                key={cuisine.key}
                className="text-xs font-semibold px-2.5 py-1 rounded-full truncate"
                style={{ color: theme.colors.primary, backgroundColor: `${theme.colors.primary}1A` }}
              >
                {cuisine.name}
              </span>
            ))
          ) : (
            <span className="text-xs" style={{ color: `${theme.colors.dark}66` }}>—</span>
          )}
        </div>

        <div
          className="flex items-center gap-3 mt-3 text-sm font-medium"
          style={{ color: `${theme.colors.dark}B3` }}
        >
          {distanceKm !== null && (
            <span className="inline-flex items-center gap-1">
              <MapPin size={16} style={{ color: theme.colors.primary }} />
              {distanceKm.toFixed(1)} {theme.content.distanceAwaySuffix}
            </span>
          )}
          {restaurant.estimatedDeliveryMinutes && (
            <span className="inline-flex items-center gap-1">
              <Clock size={16} style={{ color: theme.colors.primary }} />
              {restaurant.estimatedDeliveryMinutes} {theme.content.minutesSuffix}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}