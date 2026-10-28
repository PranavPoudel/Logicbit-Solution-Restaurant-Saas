"use client";

import { SettingsField } from "@/components/owner-settings/settings-field";
import { SettingsForm } from "@/app/owner/(owner-dashboard)/settings/page";

interface DeliveryTabProps {
  form: SettingsForm;
  set: <K extends keyof SettingsForm>(key: K, value: SettingsForm[K]) => void;
}

export function DeliveryTab({ form, set }: DeliveryTabProps) {
  return (
    <div className="space-y-4">
      <SettingsField
        label="Self-delivery radius (km)"
        type="number"
        value={form.selfDeliveryRadiusKm}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => set("selfDeliveryRadiusKm", e.target.value)}
      />
      <SettingsField
        label="Self-delivery flat fee (Rs)"
        type="number"
        value={form.selfDeliveryFlatFee}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => set("selfDeliveryFlatFee", e.target.value)}
        hint="Per-km pricing can be added once that tier is confirmed with the backend."
      />
      <SettingsField
        label="Max delivery radius (km)"
        type="number"
        value={form.maxDeliveryRadiusKm}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => set("maxDeliveryRadiusKm", e.target.value)}
      />
    </div>
  );
}