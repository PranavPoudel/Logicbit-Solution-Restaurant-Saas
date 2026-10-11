// app/owner/(owner-dashboard)/settings/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, CreditCard, ExternalLink } from "lucide-react";
import { useOwnerAuthStore } from "@/store/owner-auth-store";
import { getMyRestaurant, updateMyRestaurant, listMyRestaurants } from "@/lib/api/restaurants";
import { SettingsTabs } from "@/components/owner-settings/settings-tabs";
import { SettingsField, SettingsToggle } from "@/components/owner-settings/settings-field";
import { useGeolocation } from "@/hooks/use-geolocation";
import { DynamicMapPicker } from "@/components/map/dynamic-map-picker";
import { listCuisines, getRestaurantCuisines, setRestaurantCuisines } from "@/lib/api/cuisines";

const TABS = [
  { key: "general", label: "General" },
  { key: "location", label: "Location" },
  { key: "delivery", label: "Delivery" },
  { key: "branding", label: "Branding" },
  { key: "service", label: "Service type" },
  { key: "payments", label: "Payments" }, // <-- NEW TAB
];

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
  paypayMerchantId: string;
  paypayApiKey: string;
  paypayApiSecret: string;
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
  paypayMerchantId: "",
  paypayApiKey: "",
  paypayApiSecret: "",
};

export default function SettingsPage() {
  const restaurantId = useOwnerAuthStore((s) => s.activeRestaurantId);
  const setRestaurants = useOwnerAuthStore((s) => s.setRestaurants);
  const queryClient = useQueryClient();
  const { lat, lng } = useGeolocation();
  const [activeTab, setActiveTab] = useState("general");
  const [form, setForm] = useState<SettingsForm>(EMPTY_FORM);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  
  // Track if the user is actively typing a new secret (since we don't send the existing one)
  const [hasNewSecret, setHasNewSecret] = useState(false);

  const restaurantQuery = useQuery({
    queryKey: ["owner-restaurant", restaurantId],
    queryFn: () => getMyRestaurant(restaurantId as string),
    enabled: !!restaurantId,
  });

  useEffect(() => {
    const r = restaurantQuery.data as Record<string, unknown> | undefined;
    if (!r) return;
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
      paypayMerchantId: (r.paypayMerchantId as string) ?? prev.paypayMerchantId,
      paypayApiKey: (r.paypayApiKey as string) ?? prev.paypayApiKey,
      // NOTE: paypayApiSecret is intentionally NOT seeded from backend for security.
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantQuery.data]);

  const parseNumber = (val: string) => {
    if (!val || val.trim() === "") return undefined;
    const num = Number(val);
    return isNaN(num) ? undefined : num;
  };

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload: any = {
        name: form.name,
        address: form.address,
        city: form.city,
        latitude: parseNumber(form.latitude),
        longitude: parseNumber(form.longitude),
        primaryColor: form.primaryColor,
        secondaryColor: form.secondaryColor,
        heroHeading: form.heroHeading,
        heroSubheading: form.heroSubheading,
        isOpen: form.isOpen,
        supportsDelivery: form.supportsDelivery,
        supportsPickup: form.supportsPickup,
        supportsDineIn: form.supportsDineIn,
        selfDeliveryRadiusKm: parseNumber(form.selfDeliveryRadiusKm),
        selfDeliveryFlatFee: parseNumber(form.selfDeliveryFlatFee),
        maxDeliveryRadiusKm: parseNumber(form.maxDeliveryRadiusKm),
        paypayMerchantId: form.paypayMerchantId,
        paypayApiKey: form.paypayApiKey,
      };

      // Security: Only send the secret if the user explicitly typed something new
      if (hasNewSecret && form.paypayApiSecret.trim().length > 0) {
        payload.paypayApiSecret = form.paypayApiSecret;
      }

      return updateMyRestaurant(restaurantId as string, payload);
    },
    onSuccess: async () => {
      setSavedAt(Date.now());
      setHasNewSecret(false); // Reset secret state after successful save
      queryClient.invalidateQueries({ queryKey: ["owner-restaurant", restaurantId] });
      queryClient.invalidateQueries({ queryKey: ["restaurant-cuisines", restaurantId] });

      try {
        const freshRestaurants = await listMyRestaurants();
        setRestaurants(freshRestaurants);
      } catch (error) {
        console.error("Failed to refresh restaurant list:", error);
      }
    },
  });

  const allCuisinesQuery = useQuery({
    queryKey: ["all-cuisines"],
    queryFn: listCuisines,
  });

  const restaurantCuisinesQuery = useQuery({
    queryKey: ["restaurant-cuisines", restaurantId],
    queryFn: () => getRestaurantCuisines(restaurantId as string),
    enabled: !!restaurantId,
  });

  const [selectedCuisineIds, setSelectedCuisineIds] = useState<string[]>([]);

  useEffect(() => {
    if (restaurantCuisinesQuery.data) {
      const ids = restaurantCuisinesQuery.data.map((c: any) => c.id);
      setSelectedCuisineIds(ids);
    }
  }, [restaurantCuisinesQuery.data]);

  const updateCuisinesMutation = useMutation({
    mutationFn: (ids: string[]) => setRestaurantCuisines(restaurantId as string, ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["restaurant-cuisines", restaurantId] });
    },
  });

  const toggleCuisine = (cuisineId: string) => {
    const nextIds = selectedCuisineIds.includes(cuisineId)
      ? selectedCuisineIds.filter((id) => id !== cuisineId)
      : [...selectedCuisineIds, cuisineId];
    
    setSelectedCuisineIds(nextIds);
    updateCuisinesMutation.mutate(nextIds);
  };

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
        Manage your restaurant&apos;s profile, location, delivery, branding, and payment gateways.
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

              <div className="pt-4 border-t border-neutral-100">
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Cuisines
                </label>
                <p className="text-xs text-neutral-500 mb-3">
                  Select the types of food your restaurant serves. This helps customers find you.
                </p>
                
                {allCuisinesQuery.isLoading ? (
                  <p className="text-xs text-neutral-400">Loading cuisines...</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {allCuisinesQuery.data?.map((cuisine) => {
                      const isSelected = selectedCuisineIds.includes(cuisine.id);
                      return (
                        <button
                          key={cuisine.id}
                          type="button"
                          onClick={() => toggleCuisine(cuisine.id)}
                          disabled={updateCuisinesMutation.isPending}
                          className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-all border ${
                            isSelected
                              ? "bg-[#E3A008] text-[#17181C] border-[#E3A008] shadow-sm"
                              : "bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50"
                          } disabled:opacity-50`}
                        >
                          {cuisine.name}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === "location" && (
            <>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-neutral-700">Restaurant Location</p>
                  <button
                    onClick={() => {
                      set("latitude", String(lat));
                      set("longitude", String(lng));
                    }}
                    className="text-xs font-medium text-[#0F6B5C] hover:underline"
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
                    <label className="block text-xs font-medium text-neutral-600 mb-1">
                      Latitude
                    </label>
                    <input
                      type="text"
                      value={form.latitude}
                      onChange={(e) => set("latitude", e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-[#1B2333] focus:border-transparent outline-none font-mono"
                      placeholder="27.7172"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-600 mb-1">
                      Longitude
                    </label>
                    <input
                      type="text"
                      value={form.longitude}
                      onChange={(e) => set("longitude", e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-[#1B2333] focus:border-transparent outline-none font-mono"
                      placeholder="85.3240"
                    />
                  </div>
                </div>

                <p className="text-xs text-neutral-500">
                  Drag the marker on the map or enter coordinates manually. 
                  This determines your delivery radius and appears in &quot;Near Me&quot; searches.
                </p>
              </div>
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

          {activeTab === "payments" && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-blue-900 flex items-center gap-2">
                  <CreditCard size={16} /> PayPay Integration
                </h3>
                <p className="text-xs text-blue-700 mt-1.5 leading-relaxed">
                  Enter your PayPay for Developers credentials to accept PayPay payments. 
                  These are stored securely and used exclusively to process orders for this specific restaurant.
                </p>
              </div>

              <SettingsField
                label="Merchant ID"
                value={form.paypayMerchantId}
                onChange={(e) => set("paypayMerchantId", e.target.value)}
                placeholder="e.g., 123456789"
              />
              
              <SettingsField
                label="API Key"
                value={form.paypayApiKey}
                onChange={(e) => set("paypayApiKey", e.target.value)}
                placeholder="e.g., sample_key"
              />

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-neutral-700">
                  API Secret
                </label>
                <input
                  type={hasNewSecret ? "text" : "password"}
                  value={form.paypayApiSecret}
                  onChange={(e) => {
                    set("paypayApiSecret", e.target.value);
                    if (!hasNewSecret && e.target.value.length > 0) {
                      setHasNewSecret(true);
                    }
                  }}
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-[#1B2333] focus:border-transparent outline-none font-mono"
                  placeholder="•••••••••••••••• (Leave blank to keep existing)"
                />
                <p className="text-xs text-neutral-500">
                  For security, your existing secret is hidden and never sent to the frontend. 
                  Only fill this field if you need to update or rotate your secret.
                </p>
              </div>

              <div className="pt-2 border-t border-neutral-100">
                <a 
                  href="https://developer.paypay.ne.jp/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-[#0F6B5C] hover:underline flex items-center gap-1.5 font-medium"
                >
                  <ExternalLink size={12} /> Get credentials from PayPay for Developers
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}