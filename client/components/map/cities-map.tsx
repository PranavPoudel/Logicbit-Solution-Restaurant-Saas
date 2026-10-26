// components/map/cities-map.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { MapContainer, Marker, TileLayer, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Icon } from "@/components/ui/primitives";
import { cityLabel, type LiveCity } from "@/lib/utils/cities";

const pin = L.divIcon({
  className: "",
  iconSize: [40, 48],
  iconAnchor: [20, 44],
  html: `<span class="relative block h-10 w-10 -rotate-45 rounded-full rounded-bl-none border-4 border-white bg-chili shadow-lg"></span>`,
});

function Fit({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 1) map.setView(points[0], 11);
    else if (points.length > 1) map.fitBounds(points, { padding: [70, 70], maxZoom: 11 });
  }, [map, points]);
  return null;
}

function WheelZoom({ active }: { active: boolean }) {
  const map = useMap();
  useEffect(() => {
    if (active) map.scrollWheelZoom.enable();
    else map.scrollWheelZoom.disable();
  }, [active, map]);
  return null;
}

export function CitiesMap({ cities, onPick }: { cities: LiveCity[]; onPick: (name: string) => void }) {
  const t = useTranslations("cities");
  const locale = useLocale();
  const [active, setActive] = useState(false);
  const pinned = useMemo(() => cities.filter((c) => c.latitude != null && c.longitude != null), [cities]);
  const points = useMemo(() => pinned.map((c) => [c.latitude!, c.longitude!] as [number, number]), [pinned]);

  return (
    <div className="cities-map relative isolate h-full w-full" onMouseLeave={() => setActive(false)}>
      <MapContainer center={[20, 0]} zoom={2} scrollWheelZoom={false} style={{ height: "100%", width: "100%", position: "absolute", inset: 0 }}>
        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Fit points={points} />
        <WheelZoom active={active} />
        {pinned.map((c) => (
          <Marker key={c.id} position={[c.latitude!, c.longitude!]} icon={pin} eventHandlers={{ click: () => onPick(c.name) }} keyboard>
            <Tooltip permanent direction="top" offset={[0, -44]} className="city-tip">
              {cityLabel(c, locale)}<b className="ml-2 rounded-full bg-saffron px-2 py-0.5 text-xs text-espresso">{c.count}</b>
            </Tooltip>
          </Marker>
        ))}
      </MapContainer>
      {!active && (
        <button type="button" onClick={() => setActive(true)} className="absolute inset-0 z-[400] hidden items-end justify-center pb-6 md:flex" aria-label={t("exploreMap")}>
          <span className="shadow-soft flex items-center gap-2 rounded-full bg-ink/85 px-4 py-2 font-bold text-cream"><Icon name="search" className="h-5 w-5" />{t("exploreMap")}</span>
        </button>
      )}
    </div>
  );
}
