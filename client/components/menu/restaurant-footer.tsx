"use client";

import { Phone, MapPin } from "lucide-react";
import type { DiscoveryRestaurant } from "@/types/restaurant";

export function RestaurantFooter({ restaurant }: { restaurant: DiscoveryRestaurant }) {
  const name = restaurant.name ?? "Restaurant";
  const address = restaurant.address ?? null;
  const phone = restaurant.phone ?? null;

  return (
    // 🆕 Added mt-auto to push it to the bottom of a flex-col parent
    <footer className="bg-brand-dark text-[#FDF6EC] mt-auto">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 py-10 grid sm:grid-cols-2 gap-8">
        <div>
          <h3 className="font-serif text-lg mb-2">{name}</h3>
        </div>

        <div>
          <h4 className="text-xs uppercase tracking-wide mb-3 text-[#FDF6EC]/60">
            Contact
          </h4>
          <div className="space-y-2 text-sm text-[#FDF6EC]/90">
            {phone && (
              <div className="flex items-center gap-2">
                <Phone size={14} className="text-[#E3A008]" />
                <span>{phone}</span>
              </div>
            )}
            {address && (
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-[#E3A008]" />
                <span>{address}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-[#FDF6EC]/10 py-4 text-center text-xs text-[#FDF6EC]/40">
        Powered by LogicBit
      </div>
      
      {/* Note: LanguageSwitcherButton is intentionally omitted here because 
          it is already rendered globally in app/[locale]/(customer)/layout.tsx */}
    </footer>
  );
}