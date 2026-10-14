"use client";

import { useState } from "react";
import { Loader2, MapPin, Search } from "lucide-react";
import { DynamicMapPicker } from "@/components/map/dynamic-map-picker";
import { geocodeAddress, reverseGeocode } from "@/lib/geocode";

export interface AddressValue {
  address: string;
  lat: number | null;
  lng: number | null;
}

interface AddressPickerProps {
  value: AddressValue;
  onChange: (value: AddressValue) => void;
  onError: (message: string) => void;
  placeholder: string;
  mapLabel?: string;
  startLat?: number;
  startLng?: number;
}

export function AddressPicker({
  value,
  onChange,
  onError,
  placeholder,
  mapLabel = "Select location",
  startLat = 0,
  startLng = 0,
}: AddressPickerProps) {
  const [searching, setSearching] = useState(false);

  const handleMapChange = async (lat: number, lng: number) => {
    onChange({ ...value, lat, lng });
    const address = await reverseGeocode(lat, lng);
    if (address) onChange({ address, lat, lng });
  };

  const handleFind = async () => {
    if (!value.address.trim()) return;
    setSearching(true);
    try {
      const result = await geocodeAddress(value.address);
      if (result) onChange({ address: result.address, lat: result.lat, lng: result.lng });
      else onError("Could not find this address. Try a more specific one or drag the pin.");
    } catch {
      onError("Address search failed. Check your connection or drag the pin instead.");
    } finally {
      setSearching(false);
    }
  };

  return (
    <div>
      <div className="relative">
        <MapPin size={16} className="absolute left-3 top-3 text-neutral-400" />
        <textarea
          aria-label={placeholder}
          value={value.address}
          onChange={(e) => onChange({ ...value, address: e.target.value })}
          placeholder={placeholder}
          rows={3}
          className="w-full resize-none rounded-xl border border-[#E8E7E2] py-2.5 pl-10 pr-4 text-sm outline-none focus:border-[#E3A008] focus:ring-2 focus:ring-[#E3A008]/40"
        />
      </div>
      <button
        type="button"
        onClick={handleFind}
        disabled={searching || !value.address.trim()}
        className="mt-3 inline-flex items-center gap-2 rounded-xl bg-brand-ink px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-ink-hover disabled:opacity-50"
      >
        {searching ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
        Find on map
      </button>

      <div className="mt-5">
        <p className="mb-3 text-base font-semibold text-[#17181C]">{mapLabel}</p>
        <DynamicMapPicker lat={value.lat ?? startLat} lng={value.lng ?? startLng} onChange={handleMapChange} />
        <p className="mt-2 text-xs text-neutral-500">
          Type your address and press Find, or drag the pin to your exact spot.
        </p>
      </div>
    </div>
  );
}
