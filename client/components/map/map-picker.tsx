// components/map/map-picker.tsx
"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for Leaflet's default missing marker icons in Webpack/Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface MapPickerProps {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
  pinFixed?: boolean;
}

function FixedPin({ lat, lng, onChange }: MapPickerProps) {
  const map = useMap();
  const [moving, setMoving] = useState(false);

  useEffect(() => {
    const center = map.getCenter();
    if (Math.abs(center.lat - lat) > 1e-6 || Math.abs(center.lng - lng) > 1e-6) map.panTo([lat, lng]);
  }, [lat, lng, map]);

  useEffect(() => {
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(map.getContainer());
    return () => observer.disconnect();
  }, [map]);

  const settle = () => {
    setMoving(false);
    const center = map.getCenter();
    if (Math.abs(center.lat - lat) > 1e-6 || Math.abs(center.lng - lng) > 1e-6) onChange(center.lat, center.lng);
  };

  useMapEvents({ dragstart: () => setMoving(true), dragend: settle, zoomend: settle });

  return (
    <div className="pointer-events-none absolute inset-0 z-[500]" aria-hidden>
      <span className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/30 blur-[1px]" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png" alt="" className={`absolute left-1/2 top-1/2 h-[41px] w-[25px] -translate-x-1/2 transition-transform duration-150 ${moving ? "-translate-y-[calc(100%+10px)]" : "-translate-y-full"}`} />
    </div>
  );
}

function LocationMarker({ lat, lng, onChange }: MapPickerProps) {
  const map = useMap();

  // Optional: Pan the map smoothly if the coordinates change from outside (e.g., form reset)
  useEffect(() => {
    map.panTo([lat, lng]);
  }, [lat, lng, map]);

  useEffect(() => {
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(map.getContainer());
    return () => observer.disconnect();
  }, [map]);

  return (
    <Marker
      position={[lat, lng]}
      draggable={true}
      eventHandlers={{
        dragend: (e) => {
          // Now e.target is guaranteed to be the Marker
          const marker = e.target;
          const position = marker.getLatLng();
          onChange(position.lat, position.lng);
        },
      }}
    />
  );
}

export function MapPicker({ lat, lng, onChange, pinFixed }: MapPickerProps) {
  const centerLat = lat || 27.7172;
  const centerLng = lng || 85.3240;

  return (
    <div className="w-full h-64 rounded-xl overflow-hidden border border-neutral-300 isolate">
      <MapContainer
        center={[centerLat, centerLng]}
        zoom={13}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {pinFixed ? <FixedPin lat={centerLat} lng={centerLng} onChange={onChange} /> : <LocationMarker lat={centerLat} lng={centerLng} onChange={onChange} />}
      </MapContainer>
    </div>
  );
}