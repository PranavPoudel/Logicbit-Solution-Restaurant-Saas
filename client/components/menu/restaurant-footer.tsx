// components/menu/restaurant-footer.tsx
"use client";

import { Phone, Clock, MapPin } from "lucide-react";
import type { DiscoveryRestaurant } from "@/types/restaurant";

export function RestaurantFooter({ restaurant }: { restaurant: DiscoveryRestaurant }) {
  const name = restaurant.name ?? "Restaurant";
    const address = (restaurant as any).address ?? null;
  const phone = (restaurant as any).phone ?? null;

  return (
    <footer className="bg-[#2B1410] text-[#FDF6EC] mt-12">
      <div className="max-w-4xl mx-auto px-4 py-10 grid sm:grid-cols-3 gap-8">
        <div>
          <h3 className="font-serif text-lg mb-2">{name}</h3>
          <p className="text-[#FDF6EC]/55 text-sm">
            Bringing you fresh, delicious food, made with care.
          </p>
        </div>

        <div>
          <h4 className="text-xs uppercase tracking-wide text-[#FDF6EC]/40 mb-3">
            Contact
          </h4>
          <div className="space-y-2 text-sm text-[#FDF6EC]/70">
            {phone && (
              <div className="flex items-center gap-2">
                <Phone size={14} className="text-[#C0392B]" />
                <span>{phone}</span>
              </div>
            )}
            {address && (
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-[#C0392B]" />
                <span>{address}</span>
              </div>
            )}
          </div>
        </div>

        <div>
          <h4 className="text-xs uppercase tracking-wide text-[#FDF6EC]/40 mb-3">
            Hours
          </h4>
          <div className="flex items-center gap-2 text-sm text-[#FDF6EC]/70">
            <Clock size={14} className="text-[#C0392B]" />
            <span>Open daily, 10 AM – 10 PM</span>
          </div>
        </div>
      </div>

      <div className="border-t border-[#FDF6EC]/10 py-4 text-center text-xs text-[#FDF6EC]/40">
        Powered by LogicBit
      </div>
    </footer>
  );
}