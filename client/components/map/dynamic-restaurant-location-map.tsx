"use client";

import dynamic from "next/dynamic";

// Dynamically import to avoid SSR "window is not defined" errors
export const DynamicRestaurantLocationMap = dynamic(
  () =>
    import("@/components/map/restaurant-location-map").then((mod) => ({
      default: mod.RestaurantLocationMap,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-56 bg-[#2B1410]/5 rounded-2xl flex items-center justify-center text-sm text-[#2B1410]/40">
        Loading map...
      </div>
    ),
  }
);