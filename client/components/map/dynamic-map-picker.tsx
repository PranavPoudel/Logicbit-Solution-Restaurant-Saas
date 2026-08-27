"use client";

import dynamic from "next/dynamic";

// Dynamically import the MapPicker to avoid SSR "window is not defined" errors
export const DynamicMapPicker = dynamic(
  () => import("./map-picker").then((mod) => ({ default: mod.MapPicker })),
  { 
    ssr: false,
    loading: () => <div className="w-full h-64 bg-neutral-100 rounded-xl flex items-center justify-center text-sm text-neutral-500">Loading map...</div> 
  }
);