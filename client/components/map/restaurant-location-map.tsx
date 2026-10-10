// components/menu/restaurant-location-map.tsx
"use client";

import { MapContainer, TileLayer, Marker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for Leaflet's default missing marker icons in Webpack/Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface RestaurantLocationMapProps {
  lat: number;
  lng: number;
  address?: string;
}

export function RestaurantLocationMap({ lat, lng, address }: RestaurantLocationMapProps) {
  if (!lat || !lng) return null;

  return (
    <div className="py-4">
      <h3 className="font-serif text-lg text-[#2B1410] mb-3">Location</h3>
      <div className="w-full h-56 rounded-2xl overflow-hidden border border-[#2B1410]/8 isolate">
        <MapContainer
          center={[lat, lng]}
          zoom={15}
          scrollWheelZoom={false}
          dragging={false}
          doubleClickZoom={false}
          zoomControl={false}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={[lat, lng]} />
        </MapContainer>
      </div>
      {address && (
        <p className="text-sm text-[#2B1410]/55 mt-2">{address}</p>
      )}
    </div>
  );
}