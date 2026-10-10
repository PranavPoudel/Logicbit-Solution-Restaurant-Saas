// components/restaurant/storefront-offers-section.tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import { Ticket, Percent, Banknote } from "lucide-react";
import { getRestaurantStorefront } from "@/lib/api/discovery";

interface StorefrontOffersSectionProps {
  title: string;
  restaurantId: string;
}

export function StorefrontOffersSection({ title, restaurantId }: StorefrontOffersSectionProps) {
  // For now, this is a placeholder. You can wire it to the coupons API later.
  const offers = [
    { id: "1", title: "Weekend Special", description: "Get 20% off on all orders above Rs. 1000", type: "PERCENTAGE", value: 20 },
    { id: "2", title: "Free Delivery", description: "On orders above Rs. 500", type: "FLAT", value: 0 },
  ];

  if (offers.length === 0) return null;

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12">
      <h2 className="font-display text-2xl font-bold text-[#2B1410] mb-6">{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {offers.map((offer) => (
          <div
            key={offer.id}
            className="bg-gradient-to-br from-[#E3A008]/10 to-[#0F6B5C]/10 border border-[#E3A008]/20 rounded-2xl p-5 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#E3A008]/20 flex items-center justify-center shrink-0">
                <Ticket className="w-6 h-6 text-[#E3A008]" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-[#2B1410] mb-1">{offer.title}</h3>
                <p className="text-sm text-[#2B1410]/70">{offer.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}