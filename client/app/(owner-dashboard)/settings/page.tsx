// app/(owner-dashboard)/settings/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { useOwnerAuthStore } from "@/store/owner-auth-store";
import { getMyRestaurant, updateMyRestaurant } from "@/lib/api/restaurants";
import { SettingsTabs } from "@/components/owner-settings/settings-tabs";
import { SettingsField, SettingsToggle } from "@/components/owner-settings/settings-field";
import { useGeolocation } from "@/hooks/use-geolocation";

const TABS = [
  { key: "general", label: "General" },
  { key: "location", label: "Location" },
  { key: "delivery", label: "Delivery" },
  { key: "branding", label: "Branding" },
  { key: "service", label: "Service type" },
];

// TODO: field names here are assumed from the blueprint's Module 6 spec —
// confirm the exact PATCH /restaurants/:id body shape via Swagger and
// adjust. Unknown fields are harmless to send since UpdateRestaurantInput
// allows extras, but the backend may ignore ones it doesn't recognize.
interface SettingsForm {
  name: string;
  address: string;
  city: string;
  latitude: string;
  longitude: string;
  primaryColor: string;
  secondaryColor: string;
  heroHeading: string;
  heroSubheading: string;
  supportsDelivery: boolean;
  supportsPickup: boolean;
  supportsDineIn: boolean;
  isOpen: boolean;
  selfDeliveryRadiusKm: string;
  selfDeliveryFlatFee: string;
  maxDeliveryRadiusKm: string;
}

const EMPTY_FORM: SettingsForm = {
  name: "",
  address: "",
  city: "",
  latitude: "",
  longitude: "",
  primaryColor: "#E3A008",
  secondaryColor: "#17181C",
  heroHeading: "",
  heroSubheading: "",
  supportsDelivery: true,
  supportsPickup: false,
  supportsDineIn: false,
  isOpen: true,
  selfDeliveryRadiusKm: "5",
  selfDeliveryFlatFee: "60",
  maxDeliveryRadiusKm: "10",
};

export default function SettingsPage() {
  const restaurantId = useOwnerAuthStore((s) => s.activeRestaurantId);
  const queryClient = useQueryClient();
  const { lat, lng } = useGeolocation();
  const [activeTab, setActiveTab] = useState("general");
  const [form, setForm] = useState<SettingsForm>(EMPTY_FORM);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const restaurantQuery = useQuery({
    queryKey: ["owner-restaurant", restaurantId],
    queryFn: () => getMyRestaurant(restaurantId as string),
    enabled: !!restaurantId,
  });

  // eslint-disable-next-line react-hooks/set-state-in-effect -- seeding
  // editable form state from an async fetch; the form is mutated by the
  // user afterward so it can't be purely derived at render time.
  useEffect(() => {
    const r = restaurantQuery.data as Record<string, unknown> | undefined;
    if (!r) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm((prev) => ({
      ...prev,
      name: (r.name as string) ?? prev.name,
      address: (r.address as string) ?? prev.address,
      city: (r.city as string) ?? prev.city,
      latitude: r.latitude != null ? String(r.latitude) : prev.latitude,
      longitude: r.longitude != null ? String(r.longitude) : prev.longitude,
      primaryColor: (r.primaryColor as string) ?? prev.primaryColor,
      secondaryColor: (r.secondaryColor as string) ?? prev.secondaryColor,
      heroHeading: (r.heroHeading as string) ?? prev.heroHeading,
      heroSubheading: (r.heroSubheading as string) ?? prev.heroSubheading,
      isOpen: r.isOpen != null ? Boolean(r.isOpen) : prev.isOpen,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantQuery.data]);

  const saveMutation = useMutation({
    mutationFn: () =>
      updateMyRestaurant(restaurantId as string, {
        name: form.name,
        address: form.address,
        city: form.city,
        lat: form.latitude ? Number(form.latitude) : undefined,
        lng: form.longitude ? Number(form.longitude) : undefined,
        primaryColor: form.primaryColor,
        secondaryColor: form.secondaryColor,
        heroHeading: form.heroHeading,
        heroSubheading: form.heroSubheading,
        isOpen: form.isOpen,
        supportsDelivery: form.supportsDelivery,
        supportsPickup: form.supportsPickup,
        supportsDineIn: form.supportsDineIn,
        selfDeliveryRadiusKm: form.selfDeliveryRadiusKm
          ? Number(form.selfDeliveryRadiusKm)
          : undefined,
        selfDeliveryFlatFee: form.selfDeliveryFlatFee
          ? Number(form.selfDeliveryFlatFee)
          : undefined,
        maxDeliveryRadiusKm: form.maxDeliveryRadiusKm
          ? Number(form.maxDeliveryRadiusKm)
          : undefined,
      }),
    onSuccess: () => {
      setSavedAt(Date.now());
      queryClient.invalidateQueries({ queryKey: ["owner-restaurant", restaurantId] });
    },
  });

  function set<K extends keyof SettingsForm>(key: K, value: SettingsForm[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  if (!restaurantId) {
    return (
      <div className="max-w-6xl mx-auto flex flex-col items-center text-center gap-3 py-16">
        <AlertTriangle className="text-neutral-300" size={28} />
        <p className="text-sm text-neutral-500">
          No restaurant selected. Use the restaurant switcher in the top bar.
        </p>
      </div>
    );
  }

  if (restaurantQuery.isLoading) {
    return <p className="text-sm text-neutral-400 py-12 text-center">Loading settings…</p>;
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-xl font-semibold text-neutral-900">Settings</h1>
        <div className="flex items-center gap-3">
          {savedAt && (
            <span className="flex items-center gap-1 text-xs text-[#0F6B5C]">
              <CheckCircle2 size={13} />
              Saved
            </span>
          )}
          <button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="text-sm font-medium bg-[#1B2333] text-white px-4 py-2 rounded-lg disabled:opacity-50"
          >
            {saveMutation.isPending ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
      <p className="text-sm text-neutral-500 mb-6">
        Manage your restaurant&apos;s profile, location, delivery, and branding.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-6 items-start">
        <SettingsTabs tabs={TABS} activeKey={activeTab} onSelect={setActiveTab} />

        <div className="bg-white border border-neutral-200 rounded-xl p-5 space-y-4">
          {activeTab === "general" && (
            <>
              <SettingsField
                label="Restaurant name"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
              />
              <SettingsField
                label="Address"
                value={form.address}
                onChange={(e) => set("address", e.target.value)}
              />
              <SettingsField
                label="City"
                value={form.city}
                onChange={(e) => set("city", e.target.value)}
              />
            </>
          )}

          {activeTab === "location" && (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-neutral-700">Coordinates</p>
                <button
                  onClick={() => {
                    set("latitude", String(lat));
                    set("longitude", String(lng));
                  }}
                  className="text-xs font-medium text-[#0F6B5C]"
                >
                  Use my current location
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <SettingsField
                  label="Latitude"
                  value={form.latitude}
                  onChange={(e) => set("latitude", e.target.value)}
                />
                <SettingsField
                  label="Longitude"
                  value={form.longitude}
                  onChange={(e) => set("longitude", e.target.value)}
                />
              </div>
              <p className="text-xs text-neutral-400">
                A map picker (Mapbox/Google Maps) will replace this once an API key is
                configured — coordinates work the same either way.
              </p>
            </>
          )}

          {activeTab === "delivery" && (
            <>
              <SettingsField
                label="Self-delivery radius (km)"
                type="number"
                value={form.selfDeliveryRadiusKm}
                onChange={(e) => set("selfDeliveryRadiusKm", e.target.value)}
              />
              <SettingsField
                label="Self-delivery flat fee (Rs)"
                type="number"
                value={form.selfDeliveryFlatFee}
                onChange={(e) => set("selfDeliveryFlatFee", e.target.value)}
                hint="Per-km pricing can be added once that tier is confirmed with the backend."
              />
              <SettingsField
                label="Max delivery radius (km)"
                type="number"
                value={form.maxDeliveryRadiusKm}
                onChange={(e) => set("maxDeliveryRadiusKm", e.target.value)}
              />
            </>
          )}

          {activeTab === "branding" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    Primary color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={form.primaryColor}
                      onChange={(e) => set("primaryColor", e.target.value)}
                      className="w-10 h-10 rounded-lg border border-neutral-200"
                    />
                    <span className="text-sm font-mono text-neutral-500">
                      {form.primaryColor}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    Secondary color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={form.secondaryColor}
                      onChange={(e) => set("secondaryColor", e.target.value)}
                      className="w-10 h-10 rounded-lg border border-neutral-200"
                    />
                    <span className="text-sm font-mono text-neutral-500">
                      {form.secondaryColor}
                    </span>
                  </div>
                </div>
              </div>
              <SettingsField
                label="Hero heading"
                value={form.heroHeading}
                onChange={(e) => set("heroHeading", e.target.value)}
                placeholder="e.g. Authentic Newari food, made fresh"
              />
              <SettingsField
                label="Hero subheading"
                value={form.heroSubheading}
                onChange={(e) => set("heroSubheading", e.target.value)}
              />
            </>
          )}

          {activeTab === "service" && (
            <>
              <SettingsToggle
                label="Open for orders"
                hint="Turn off to pause new orders temporarily."
                checked={form.isOpen}
                onChange={(v) => set("isOpen", v)}
              />
              <SettingsToggle
                label="Delivery"
                checked={form.supportsDelivery}
                onChange={(v) => set("supportsDelivery", v)}
              />
              <SettingsToggle
                label="Pickup"
                checked={form.supportsPickup}
                onChange={(v) => set("supportsPickup", v)}
              />
              <SettingsToggle
                label="Dine-in"
                checked={form.supportsDineIn}
                onChange={(v) => set("supportsDineIn", v)}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
