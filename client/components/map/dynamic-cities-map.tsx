"use client";

import dynamic from "next/dynamic";

export const DynamicCitiesMap = dynamic(() => import("@/components/map/cities-map").then((mod) => ({ default: mod.CitiesMap })), {
  ssr: false,
  loading: () => <div className="shimmer absolute inset-0" aria-hidden />,
});
