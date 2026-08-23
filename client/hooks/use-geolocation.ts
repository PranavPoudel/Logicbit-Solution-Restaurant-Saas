// hooks/use-geolocation.ts
"use client";

import { useEffect, useState } from "react";

// Fallback: Kirtipur, Kathmandu (matches the location pill shown in the header)
const FALLBACK_COORDS = { lat: 27.6768, lng: 85.287 };

interface GeolocationState {
  lat: number;
  lng: number;
  isUsingFallback: boolean;
  isResolved: boolean;
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    ...FALLBACK_COORDS,
    isUsingFallback: true,
    isResolved: false,
  });

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      // one-time capability check, no async callback to hang this off of
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setState((s) => ({ ...s, isResolved: true }));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          isUsingFallback: false,
          isResolved: true,
        });
      },
      () => {
        // permission denied or unavailable — keep the fallback coords
        setState((s) => ({ ...s, isResolved: true }));
      },
      { timeout: 5000 }
    );
  }, []);

  return state;
}
