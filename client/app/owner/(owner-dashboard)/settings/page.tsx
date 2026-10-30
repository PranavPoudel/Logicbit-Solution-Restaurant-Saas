// app/owner/(owner-dashboard)/settings/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { useOwnerAuthStore } from "@/store/owner-auth-store";
import { getMyRestaurant, listMyRestaurants, updateMyRestaurant, type RestaurantUpdatePayload } from "@/lib/api/restaurants";
import { SettingsTabs } from "@/components/owner-settings/settings-tabs";
import { useGeolocation } from "@/hooks/use-geolocation";
import { DEFAULT_HOURS } from "@/components/owner-settings/opening-hours-editor";
import type { DayHours } from "@/types/hours";
import { listCuisines, getRestaurantCuisines, setRestaurantCuisines } from "@/lib/api/cuisines";

// Import extracted tabs
import { GeneralTab } from "@/components/owner-settings/general-tab";
import { LocationTab } from "@/components/owner-settings/location-tab";
import { DeliveryTab } from "@/components/owner-settings/delivery-tab";
import { BrandingTab } from "@/components/owner-settings/branding-tab";
import { ServiceTab } from "@/components/owner-settings/service-tab";
import { PaymentsTab } from "@/components/owner-settings/payments-tab";

const TABS = [
  { key: "general", label: "General" },
  { key: "location", label: "Location" },
  { key: "delivery", label: "Delivery" },
  { key: "branding", label: "Branding" },
  { key: "service", label: "Service type" },
  { key: "payments", label: "Payments" },
];

export interface SettingsForm {
  name: string;
  address: string;
  phone: string;
  refundPolicy: string;
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
  openingHours: DayHours[];
  timezone: string;
  selfDeliveryRadiusKm: string;
  selfDeliveryFlatFee: string;
  maxDeliveryRadiusKm: string;
  paypayMerchantId: string;
  paypayApiKey: string;
  paypayApiSecret: string;
  supportsCod: boolean;
  supportsCreditCard: boolean;
  supportsEsewa: boolean;
  supportsKhalti: boolean;
  supportsIps: boolean;
  supportsPhonePay: boolean;
  supportsPaypay: boolean;
}

const EMPTY_FORM: SettingsForm = {
  name: "", address: "", phone: "", refundPolicy: "", city: "", latitude: "", longitude: "",
  primaryColor: "#E3A008", secondaryColor: "#17181C", heroHeading: "", heroSubheading: "",
  supportsDelivery: true, supportsPickup: false, supportsDineIn: false, isOpen: true,
  openingHours: DEFAULT_HOURS, timezone: "Asia/Kathmandu", selfDeliveryRadiusKm: "5",
  selfDeliveryFlatFee: "60", maxDeliveryRadiusKm: "10", paypayMerchantId: "", paypayApiKey: "",
  paypayApiSecret: "", supportsCod: true, supportsCreditCard: false, supportsEsewa: false,
  supportsKhalti: false, supportsIps: false, supportsPhonePay: false, supportsPaypay: false,
};

export default function SettingsPage() {
  const restaurantId = useOwnerAuthStore((s) => s.activeRestaurantId);
  const setRestaurants = useOwnerAuthStore((s) => s.setRestaurants);
  const queryClient = useQueryClient();
  const { lat, lng } = useGeolocation();
  
  const [activeTab, setActiveTab] = useState("general");
  const [form, setForm] = useState<SettingsForm>(EMPTY_FORM);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [hoursEdited, setHoursEdited] = useState(false);
  const [hasNewSecret, setHasNewSecret] = useState(false);
  const [selectedCuisineIds, setSelectedCuisineIds] = useState<string[]>([]);

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
      phone: (r.phone as string) ?? prev.phone,
      refundPolicy: (r.refundPolicy as string) ?? prev.refundPolicy,
      city: (r.city as string) ?? prev.city,
      latitude: r.latitude != null ? String(r.latitude) : prev.latitude,
      longitude: r.longitude != null ? String(r.longitude) : prev.longitude,
      primaryColor: (r.primaryColor as string) ?? prev.primaryColor,
      secondaryColor: (r.secondaryColor as string) ?? prev.secondaryColor,
      heroHeading: (r.heroHeading as string) ?? prev.heroHeading,
      heroSubheading: (r.heroSubheading as string) ?? prev.heroSubheading,
      isOpen: r.isOpen != null ? Boolean(r.isOpen) : prev.isOpen,
      openingHours: Array.isArray(r.openingHours) ? (r.openingHours as DayHours[]) : prev.openingHours,
      timezone: (r.timezone as string) ?? prev.timezone,
      paypayMerchantId: (r.paypayMerchantId as string) ?? prev.paypayMerchantId,
      paypayApiKey: (r.paypayApiKey as string) ?? prev.paypayApiKey,
      supportsCod: r.supportsCod != null ? Boolean(r.supportsCod) : prev.supportsCod,
      supportsCreditCard: r.supportsCreditCard != null ? Boolean(r.supportsCreditCard) : prev.supportsCreditCard,
      supportsEsewa: r.supportsEsewa != null ? Boolean(r.supportsEsewa) : prev.supportsEsewa,
      supportsKhalti: r.supportsKhalti != null ? Boolean(r.supportsKhalti) : prev.supportsKhalti,
      supportsIps: r.supportsIps != null ? Boolean(r.supportsIps) : prev.supportsIps,
      supportsPhonePay: r.supportsPhonePay != null ? Boolean(r.supportsPhonePay) : prev.supportsPhonePay,
      supportsPaypay: r.supportsPaypay != null ? Boolean(r.supportsPaypay) : prev.supportsPaypay,
    }));
  }, [restaurantQuery.data]);

  const parseNumber = (val: string) => {
    if (!val || val.trim() === "") return undefined;
    const num = Number(val);
    return isNaN(num) ? undefined : num;
  };

  const saveMutation = useMutation({
    mutationFn: () => {
      // ✅ FIXED: Replaced 'any' with proper type
      const payload: RestaurantUpdatePayload = {
        name: form.name,
        address: form.address,
        phone: form.phone.trim() || undefined,
        refundPolicy: form.refundPolicy.trim(),
        city: form.city,
        latitude: parseNumber(form.latitude),
        longitude: parseNumber(form.longitude),
        primaryColor: form.primaryColor,
        secondaryColor: form.secondaryColor,
        heroHeading: form.heroHeading,
        heroSubheading: form.heroSubheading,
        isOpen: form.isOpen,
        openingHours: hoursEdited ? form.openingHours : undefined,
        timezone: form.timezone,
        supportsDelivery: form.supportsDelivery,
        supportsPickup: form.supportsPickup,
        supportsDineIn: form.supportsDineIn,
        selfDeliveryRadiusKm: parseNumber(form.selfDeliveryRadiusKm),
        selfDeliveryFlatFee: parseNumber(form.selfDeliveryFlatFee),
        maxDeliveryRadiusKm: parseNumber(form.maxDeliveryRadiusKm),
        supportsCod: form.supportsCod,
        supportsCreditCard: form.supportsCreditCard,
        supportsEsewa: form.supportsEsewa,
        supportsKhalti: form.supportsKhalti,
        supportsIps: form.supportsIps,
        supportsPhonePay: form.supportsPhonePay,
        supportsPaypay: form.supportsPaypay,
        paypayMerchantId: form.paypayMerchantId,
        paypayApiKey: form.paypayApiKey,
      };

      if (hasNewSecret && form.paypayApiSecret.trim().length > 0) {
        payload.paypayApiSecret = form.paypayApiSecret;
      }

      return updateMyRestaurant(restaurantId as string, payload);
    },
    onSuccess: async () => {
      setSavedAt(Date.now());
      setHasNewSecret(false);
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

  const allCuisinesQuery = useQuery({ queryKey: ["all-cuisines"], queryFn: listCuisines });
  const restaurantCuisinesQuery = useQuery({
    queryKey: ["restaurant-cuisines", restaurantId],
    queryFn: () => getRestaurantCuisines(restaurantId as string),
    enabled: !!restaurantId,
  });

  useEffect(() => {
    if (restaurantCuisinesQuery.data) {
      // ✅ FIXED: Removed 'any' cast. Assuming API returns { id: string, name: string }
      const ids = restaurantCuisinesQuery.data.map((c: { id: string }) => c.id);
      setSelectedCuisineIds(ids);
    }
  }, [restaurantCuisinesQuery.data]);

  const updateCuisinesMutation = useMutation({
    mutationFn: (ids: string[]) => setRestaurantCuisines(restaurantId as string, ids),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["restaurant-cuisines", restaurantId] }),
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
        <p className="text-sm text-neutral-500">No restaurant selected. Use the restaurant switcher in the top bar.</p>
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
              <CheckCircle2 size={13} /> Saved
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
            <GeneralTab 
              form={form} set={set} 
              allCuisines={allCuisinesQuery.data} 
              isLoadingCuisines={allCuisinesQuery.isLoading}
              selectedCuisineIds={selectedCuisineIds}
              toggleCuisine={toggleCuisine}
              isUpdatingCuisines={updateCuisinesMutation.isPending}
            />
          )}
          {activeTab === "location" && <LocationTab form={form} set={set} browserLat={lat} browserLng={lng} />}
          {activeTab === "delivery" && <DeliveryTab form={form} set={set} />}
          {activeTab === "branding" && <BrandingTab form={form} set={set} />}
          {activeTab === "service" && <ServiceTab form={form} set={set} hoursEdited={hoursEdited} setHoursEdited={setHoursEdited} />}
          {activeTab === "payments" && <PaymentsTab form={form} set={set} hasNewSecret={hasNewSecret} setHasNewSecret={setHasNewSecret} />}
        </div>
      </div>
    </div>
  );
}