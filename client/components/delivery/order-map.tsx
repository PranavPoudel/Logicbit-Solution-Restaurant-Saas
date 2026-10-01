"use client";

import { useEffect } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";

interface Point {
  lat: number;
  lng: number;
}

interface Props {
  restaurant?: (Point & { name?: string }) | null;
  customer?: (Point & { address?: string | null }) | null;
  rider?: Point | null;
}

function pin(color: string, label: string) {
  return L.divIcon({
    className: "",
    iconSize: [34, 44],
    iconAnchor: [17, 42],
    popupAnchor: [0, -38],
    html: `<div style="width:34px;height:34px;border-radius:50% 50% 50% 0;background:${color};transform:rotate(-45deg);border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center"><span style="transform:rotate(45deg);color:#fff;font:700 13px system-ui">${label}</span></div>`,
  });
}

const restaurantIcon = pin("#17181C", "R");
const customerIcon = pin("#DC2626", "D");
const riderIcon = pin("#2563EB", "Me");

// Fits the view to the order's own pins only, so live rider updates
// don't keep resetting the map while the rider pans around.
function FitBounds({ points }: { points: Point[] }) {
  const map = useMap();
  const key = points.map((p) => `${p.lat.toFixed(5)},${p.lng.toFixed(5)}`).join("|");

  useEffect(() => {
    map.invalidateSize();
    if (points.length === 1) {
      map.setView([points[0].lat, points[0].lng], 15);
    } else if (points.length > 1) {
      map.fitBounds(
        L.latLngBounds(points.map((p) => [p.lat, p.lng] as [number, number])),
        { padding: [48, 48], maxZoom: 16 }
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, key]);

  return null;
}

export default function OrderMap({ restaurant, customer, rider }: Props) {
  const orderPoints: Point[] = [restaurant, customer].filter(
    (p): p is NonNullable<typeof p> => !!p
  );
  const center: [number, number] = orderPoints[0]
    ? [orderPoints[0].lat, orderPoints[0].lng]
    : [27.7172, 85.324];

  return (
    <MapContainer center={center} zoom={14} scrollWheelZoom className="h-full w-full">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds points={orderPoints} />
      {restaurant && (
        <Marker position={[restaurant.lat, restaurant.lng]} icon={restaurantIcon}>
          <Popup>
            <strong>Pickup</strong>
            <br />
            {restaurant.name}
          </Popup>
        </Marker>
      )}
      {customer && (
        <Marker position={[customer.lat, customer.lng]} icon={customerIcon}>
          <Popup>
            <strong>Drop-off</strong>
            {customer.address && (
              <>
                <br />
                {customer.address}
              </>
            )}
          </Popup>
        </Marker>
      )}
      {rider && (
        <Marker position={[rider.lat, rider.lng]} icon={riderIcon}>
          <Popup>You are here</Popup>
        </Marker>
      )}
    </MapContainer>
  );
}