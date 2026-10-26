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
    loading: () => <div className="h-full min-h-[260px] animate-pulse rounded-[32px] rounded-tl-[120px] bg-ink/10 md:min-h-[380px]" aria-hidden />,
  }
);
