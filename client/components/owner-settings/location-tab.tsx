"use client";

import { DynamicMapPicker } from "@/components/map/dynamic-map-picker";
import { SettingsForm } from "@/app/owner/(owner-dashboard)/settings/page";

interface LocationTabProps {
  form: SettingsForm;
  set: <K extends keyof SettingsForm>(key: K, value: SettingsForm[K]) => void;
  browserLat: number | null;
  browserLng: number | null;
}

export function LocationTab({ form, set, browserLat, browserLng }: LocationTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-neutral-700">Restaurant Location</p>
        <button
          onClick={() => {
            if (browserLat && browserLng) {
              set("latitude", String(browserLat));
              set("longitude", String(browserLng));
            }
          }}
          className="text-xs font-medium text-[#0F6B5C] hover:underline disabled:opacity-50"
          disabled={!browserLat || !browserLng}
        >
          Use browser&apos;s current location
        </button>
      </div>

      <DynamicMapPicker
        lat={form.latitude ? Number(form.latitude) : 27.7172}
        lng={form.longitude ? Number(form.longitude) : 85.3240}
        onChange={(newLat, newLng) => {
          set("latitude", String(newLat));
          set("longitude", String(newLng));
        }}
      />

      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-neutral-200">
        <div>
          <label className="block text-xs font-medium text-neutral-600 mb-1">Latitude</label>
          <input
            type="text"
            value={form.latitude}
            onChange={(e) => set("latitude", e.target.value)}
            className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-[#1B2333] outline-none font-mono"
            placeholder="27.7172"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-neutral-600 mb-1">Longitude</label>
          <input
            type="text"
            value={form.longitude}
            onChange={(e) => set("longitude", e.target.value)}
            className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-[#1B2333] outline-none font-mono"
            placeholder="85.3240"
          />
        </div>
      </div>
      <p className="text-xs text-neutral-500">
        Drag the marker on the map or enter coordinates manually. This determines your delivery radius and appears in &quot;Near Me&quot; searches.
      </p>
    </div>
  );
}