"use client";

import { useEffect, useMemo } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";

export interface DeliveryLocation {
  latitude: number;
  longitude: number;
}

interface DeliveryLocationPickerProps {
  value: DeliveryLocation | null;
  onChange: (location: DeliveryLocation) => void;
}

const DEFAULT_CENTER: [number, number] = [28.3949, 84.124];

function createPinIcon() {
  return L.divIcon({
    className: "",
    iconSize: [42, 52],
    iconAnchor: [21, 50],
    popupAnchor: [0, -46],
    html: `
      <div
        style="
          width:42px;
          height:42px;
          border-radius:50% 50% 50% 0;
          background:#DC2626;
          transform:rotate(-45deg);
          border:3px solid white;
          box-shadow:0 3px 10px rgba(0,0,0,.35);
          display:flex;
          align-items:center;
          justify-content:center;
        "
      >
        <span
          style="
            transform:rotate(45deg);
            color:white;
            font:700 16px system-ui;
          "
        >
          D
        </span>
      </div>
    `,
  });
}

const deliveryPin = createPinIcon();

function MapClickHandler({
  onChange,
}: {
  onChange: (location: DeliveryLocation) => void;
}) {
  useMapEvents({
    click(event) {
      onChange({
        latitude: event.latlng.lat,
        longitude: event.latlng.lng,
      });
    },
  });

  return null;
}

function SelectedLocationView({
  value,
}: {
  value: DeliveryLocation | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (!value) return;

    map.setView(
      [value.latitude, value.longitude],
      Math.max(map.getZoom(), 16),
      {
        animate: true,
      }
    );
  }, [map, value]);

  return null;
}

export default function DeliveryLocationPicker({
  value,
  onChange,
}: DeliveryLocationPickerProps) {
  const center = useMemo<[number, number]>(() => {
    if (
      value &&
      Number.isFinite(value.latitude) &&
      Number.isFinite(value.longitude)
    ) {
      return [value.latitude, value.longitude];
    }

    return DEFAULT_CENTER;
  }, [value]);

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-xl border border-[#E8E7E2] bg-neutral-100">
        <div className="h-[360px] w-full">
          <MapContainer
            center={center}
            zoom={value ? 16 : 7}
            scrollWheelZoom
            className="h-full w-full"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <MapClickHandler onChange={onChange} />

            <SelectedLocationView value={value} />

            {value &&
              Number.isFinite(value.latitude) &&
              Number.isFinite(value.longitude) && (
                <Marker
                  position={[value.latitude, value.longitude]}
                  icon={deliveryPin}
                >
                  <Popup>
                    <strong>Delivery location</strong>
                    <br />
                    {value.latitude.toFixed(6)},{" "}
                    {value.longitude.toFixed(6)}
                  </Popup>
                </Marker>
              )}
          </MapContainer>
        </div>
      </div>

      <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2.5">
        <p className="text-sm font-medium text-amber-800">
          Click on the map to choose your delivery location.
        </p>

        <p className="mt-1 text-xs text-amber-700">
          You do not need to allow browser location access. The red pin
          will be placed exactly where you click.
        </p>
      </div>

      {value &&
        Number.isFinite(value.latitude) &&
        Number.isFinite(value.longitude) && (
          <div className="rounded-xl border border-green-200 bg-green-50 px-3 py-2.5">
            <p className="text-xs font-semibold text-green-700">
              Delivery location selected
            </p>

            <p className="mt-1 font-mono text-xs text-green-700">
              Latitude: {value.latitude.toFixed(6)}
              <br />
              Longitude: {value.longitude.toFixed(6)}
            </p>
          </div>
        )}
    </div>
  );
}
