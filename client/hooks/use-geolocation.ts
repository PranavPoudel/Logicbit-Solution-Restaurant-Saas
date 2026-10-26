// hooks/use-geolocation.ts
"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { listCities } from "@/lib/api/cities";

const FALLBACK_COORDS = { lat: 27.6768, lng: 85.287 };

type Coords = { lat: number; lng: number };

export function useGeolocation() {
  const citiesQuery = useQuery({ queryKey: ["cities"], queryFn: listCities, staleTime: 5 * 60 * 1000 });
  const [coords, setCoords] = useState<Coords | null>(null);
  const [asked, setAsked] = useState(false);

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      // one-time capability check, no async callback to hang this off of
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAsked(true);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
        setAsked(true);
      },
      () => setAsked(true),
      { timeout: 5000 }
    );
  }, []);

  const home = citiesQuery.data?.[0];
  const fallback = home ? { lat: home.latitude, lng: home.longitude } : FALLBACK_COORDS;
  const { lat, lng } = coords ?? fallback;

  return { lat, lng, position: coords, isUsingFallback: !coords, isResolved: asked && !citiesQuery.isPending };
}
