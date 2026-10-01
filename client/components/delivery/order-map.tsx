
"use client";

import { useEffect } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";

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
    html: `
      <div
        style="
          width:34px;
          height:34px;
          border-radius:50% 50% 50% 0;
          background:${color};
          transform:rotate(-45deg);
          border:3px solid #fff;
          box-shadow:0 2px 6px rgba(0,0,0,.35);
          display:flex;
          align-items:center;
          justify-content:center;
        "
      >
        <span
          style="
            transform:rotate(45deg);
            color:#fff;
            font:700 13px system-ui;
          "
        >
          ${label}
        </span>
      </div>
    `,
  });
}

const restaurantIcon = pin("#17181C", "R");
const customerIcon = pin("#DC2626", "D");
const riderIcon = pin("#2563EB", "Me");

function FitOrderBounds({
  restaurant,
  customer,
}: {
  restaurant?: Point | null;
  customer?: Point | null;
}) {
  const map = useMap();

  const points: Point[] = [restaurant, customer].filter(
    (point): point is Point =>
      !!point &&
      Number.isFinite(point.lat) &&
      Number.isFinite(point.lng)
  );

  const key = points
    .map((point) => `${point.lat.toFixed(6)},${point.lng.toFixed(6)}`)
    .join("|");

  useEffect(() => {
    map.invalidateSize();

    if (points.length === 0) {
      return;
    }

    if (points.length === 1) {
      map.setView([points[0].lat, points[0].lng], 16);
      return;
    }

    map.fitBounds(
      L.latLngBounds(
        points.map(
          (point) => [point.lat, point.lng] as [number, number]
        )
      ),
      {
        padding: [50, 50],
        maxZoom: 16,
      }
    );
  }, [map, key]);

  return null;
}

export default function OrderMap({
  restaurant,
  customer,
  rider,
}: Props) {
  const hasCustomer =
    !!customer &&
    Number.isFinite(customer.lat) &&
    Number.isFinite(customer.lng);

  const hasRestaurant =
    !!restaurant &&
    Number.isFinite(restaurant.lat) &&
    Number.isFinite(restaurant.lng);

  /*
   * IMPORTANT:
   * Customer delivery location gets priority.
   *
   * There is deliberately NO Kathmandu fallback here.
   */
  const center: [number, number] = hasCustomer
    ? [customer!.lat, customer!.lng]
    : hasRestaurant
      ? [restaurant!.lat, restaurant!.lng]
      : [0, 0];

  return (
    <MapContainer
      center={center}
      zoom={hasCustomer || hasRestaurant ? 15 : 2}
      scrollWheelZoom
      className="h-full w-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <FitOrderBounds
        restaurant={hasRestaurant ? restaurant : null}
        customer={hasCustomer ? customer : null}
      />

      {hasRestaurant && (
        <Marker
          position={[restaurant!.lat, restaurant!.lng]}
          icon={restaurantIcon}
        >
          <Popup>
            <strong>Pickup</strong>
            <br />
            {restaurant!.name ?? "Restaurant"}
          </Popup>
        </Marker>
      )}

      {hasCustomer && (
        <Marker
          position={[customer!.lat, customer!.lng]}
          icon={customerIcon}
        >
          <Popup>
            <strong>Drop-off</strong>

            {customer!.address && (
              <>
                <br />
                {customer!.address}
              </>
            )}

            <br />
            <span>
              {customer!.lat.toFixed(6)}, {customer!.lng.toFixed(6)}
            </span>
          </Popup>
        </Marker>
      )}

      {rider &&
        Number.isFinite(rider.lat) &&
        Number.isFinite(rider.lng) && (
          <Marker
            position={[rider.lat, rider.lng]}
            icon={riderIcon}
          >
            <Popup>You are here</Popup>
          </Marker>
        )}
    </MapContainer>
  );
}
