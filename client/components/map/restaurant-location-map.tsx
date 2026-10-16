// components/map/restaurant-location-map.tsx
"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { MapContainer, Marker, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Icon } from "@/components/ui/primitives";

interface RestaurantLocationMapProps {
  lat: number;
  lng: number;
  initial?: string;
  km?: number | null;
}

const pin = (initial: string) =>
  L.divIcon({
    className: "",
    iconSize: [48, 56],
    iconAnchor: [24, 52],
    html: `<span class="relative grid h-12 w-12 -rotate-45 place-items-center rounded-full rounded-bl-none border-4 border-white bg-[var(--accent,var(--brand-chili))] shadow-lg"><span class="rotate-45 font-display text-lg font-extrabold text-[var(--accent-ink,var(--brand-parchment))]">${initial}</span></span>`,
  });

function WheelZoom({ active }: { active: boolean }) {
  const map = useMap();
  useEffect(() => {
    if (active) map.scrollWheelZoom.enable();
    else map.scrollWheelZoom.disable();
  }, [active, map]);
  return null;
}

export function RestaurantLocationMap({ lat, lng, initial = "•", km }: RestaurantLocationMapProps) {
  const t = useTranslations("restaurant");
  const [active, setActive] = useState(false);
  if (!lat || !lng) return null;

  return (
    <div className="relative isolate h-full min-h-[260px] overflow-hidden rounded-[32px] rounded-tl-[120px] md:min-h-[380px]" onMouseLeave={() => setActive(false)}>
      <MapContainer center={[lat, lng]} zoom={15} scrollWheelZoom={false} style={{ height: "100%", width: "100%", position: "absolute", inset: 0 }}>
        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Marker position={[lat, lng]} icon={pin(initial.charAt(0).toUpperCase())} />
        <WheelZoom active={active} />
      </MapContainer>
      {km != null && (
        <span className="shadow-soft absolute left-6 top-6 z-[500] flex items-center gap-2 rounded-full bg-paper px-4 py-2 font-bold md:left-24">
          <Icon name="pin" className="h-5 w-5 text-chili" />{t("kmFromYou", { km: km.toFixed(1) })}
        </span>
      )}
      {!active && (
        <button type="button" onClick={() => setActive(true)} className="absolute inset-0 z-[400] hidden items-end justify-center pb-8 md:flex" aria-label={t("exploreMap")}>
          <span className="shadow-soft flex items-center gap-2 rounded-full bg-ink/85 px-4 py-2 font-bold text-cream"><Icon name="search" className="h-5 w-5" />{t("exploreMap")}</span>
        </button>
      )}
    </div>
  );
}
