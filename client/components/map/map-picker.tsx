// components/map/map-picker.tsx
"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
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
}

function LocationMarker({ lat, lng, onChange }: MapPickerProps) {
  const map = useMap();

  // Optional: Pan the map smoothly if the coordinates change from outside (e.g., form reset)
  useEffect(() => {
    map.panTo([lat, lng]);
  }, [lat, lng, map]);

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

export function MapPicker({ lat, lng, onChange }: MapPickerProps) {
  const centerLat = lat || 27.7172;
  const centerLng = lng || 85.3240;

  return (
    <div className="w-full h-64 rounded-xl overflow-hidden border border-neutral-300 z-0">
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
        <LocationMarker lat={centerLat} lng={centerLng} onChange={onChange} />
      </MapContainer>
    </div>
  );
}