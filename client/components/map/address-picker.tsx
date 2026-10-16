"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { DynamicMapPicker } from "@/components/map/dynamic-map-picker";
import { geocodeAddress, reverseGeocode } from "@/lib/geocode";
import { Button, Icon } from "@/components/ui/primitives";

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
  const t = useTranslations("address");
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
      else onError(t("notFound"));
    } catch {
      onError(t("searchFailed"));
    } finally {
      setSearching(false);
    }
  };

  return (
    <div>
      <div className="relative">
        <Icon name="pin" className="pointer-events-none absolute left-4 top-4 h-5 w-5 text-ink/50" />
        <textarea
          aria-label={placeholder}
          value={value.address}
          onChange={(e) => onChange({ ...value, address: e.target.value })}
          placeholder={placeholder}
          rows={3}
          className="w-full resize-none rounded-2xl border-2 border-ink/15 bg-paper py-3.5 pl-12 pr-4 text-base text-ink outline-none transition placeholder:text-ink/50 focus:border-ink"
        />
      </div>
      <Button variant="outline" onClick={handleFind} disabled={searching || !value.address.trim()} className="mt-3">
        {searching ? <span className="h-4 w-4 animate-spin rounded-full border-[3px] border-current border-t-transparent" /> : <Icon name="search" className="h-4 w-4" />}
        {t("find")}
      </Button>

      <div className="mt-5">
        <p className="mb-3 font-display text-xl font-extrabold">{mapLabel}</p>
        <div className="overflow-hidden rounded-[22px] border-2 border-ink/15 [&>div]:!rounded-none [&>div]:!border-0">
          <DynamicMapPicker lat={value.lat ?? startLat} lng={value.lng ?? startLng} onChange={handleMapChange} />
        </div>
        <p className="mt-2 text-ink/70">{t("hint")}</p>
      </div>
    </div>
  );
}
