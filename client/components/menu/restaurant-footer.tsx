// components/menu/restaurant-footer.tsx
"use client";

import { Phone, Clock, MapPin } from "lucide-react";
import type { DiscoveryRestaurant } from "@/types/restaurant";
import { theme } from "@/config/theme";

export function RestaurantFooter({ restaurant }: { restaurant: DiscoveryRestaurant }) {
  const name = restaurant.name ?? "Restaurant";
  const address = (restaurant as any).address ?? null;
  const phone = (restaurant as any).phone ?? null;

  return (
    <footer
      className="w-full mt-12"
      style={{ backgroundColor: theme.colors.dark, color: theme.colors.background }}
    >
      <div className="w-full max-w-6xl mx-auto px-4 py-10 grid sm:grid-cols-3 gap-8">
        <div>
          <h3 className="font-serif text-lg mb-2">{name}</h3>
          <p className="text-sm" style={{ color: `${theme.colors.background}8C` }}>
            {theme.content.footerTagline}
          </p>
        </div>

        <div>
          <h4
            className="text-xs uppercase tracking-wide mb-3"
            style={{ color: `${theme.colors.background}66` }}
          >
            Contact
          </h4>
          <div className="space-y-2 text-sm" style={{ color: `${theme.colors.background}B3` }}>
            {phone && (
              <div className="flex items-center gap-2">
                <Phone size={14} style={{ color: theme.colors.primary }} />
                <span>{phone}</span>
              </div>
            )}
            {address && (
              <div className="flex items-center gap-2">
                <MapPin size={14} style={{ color: theme.colors.primary }} />
                <span>{address}</span>
              </div>
            )}
          </div>
        </div>

        <div>
          <h4
            className="text-xs uppercase tracking-wide mb-3"
            style={{ color: `${theme.colors.background}66` }}
          >
            Hours
          </h4>
          <div className="flex items-center gap-2 text-sm" style={{ color: `${theme.colors.background}B3` }}>
            <Clock size={14} style={{ color: theme.colors.primary }} />
            <span>{theme.content.footerHours}</span>
          </div>
        </div>
      </div>

      <div
        className="w-full py-4 text-center text-xs"
        style={{
          borderTop: `1px solid ${theme.colors.background}1A`,
          color: `${theme.colors.background}66`,
        }}
      >
        {theme.content.footerCredit} {theme.brand.name}
      </div>
    </footer>
  );
}