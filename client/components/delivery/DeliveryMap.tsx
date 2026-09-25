"use client";

import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
} from "react-leaflet";

interface DeliveryMapProps {
  riderLocation: {
    latitude: number;
    longitude: number;
  } | null;

  restaurantLocation: {
    latitude: number;
    longitude: number;
  } | null;
}

export default function DeliveryMap({
  riderLocation,
  restaurantLocation,
}: DeliveryMapProps) {
  const center = riderLocation
    ? [riderLocation.latitude, riderLocation.longitude] as [number, number]
    : restaurantLocation
      ? [
          restaurantLocation.latitude,
          restaurantLocation.longitude,
        ] as [number, number]
      : [27.7172, 85.324] as [number, number];

  return (
    <div className="h-[400px] w-full overflow-hidden rounded-xl border">
      <MapContainer
        center={center}
        zoom={14}
        scrollWheelZoom
        className="h-full w-full"
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {riderLocation && (
          <CircleMarker
            center={[
              riderLocation.latitude,
              riderLocation.longitude,
            ]}
            radius={10}
          >
            <Popup>Your current location</Popup>
          </CircleMarker>
        )}

        {restaurantLocation && (
          <CircleMarker
            center={[
              restaurantLocation.latitude,
              restaurantLocation.longitude,
            ]}
            radius={10}
          >
            <Popup>Restaurant pickup location</Popup>
          </CircleMarker>
        )}
      </MapContainer>
    </div>
  );
}