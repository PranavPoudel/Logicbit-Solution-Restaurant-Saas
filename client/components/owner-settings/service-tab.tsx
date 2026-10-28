"use client";

import { SettingsToggle } from "@/components/owner-settings/settings-field";
import { OpeningHoursEditor, DEFAULT_HOURS } from "@/components/owner-settings/opening-hours-editor";
import { SettingsForm } from "@/app/owner/(owner-dashboard)/settings/page";

interface ServiceTabProps {
  form: SettingsForm;
  set: <K extends keyof SettingsForm>(key: K, value: SettingsForm[K]) => void;
  hoursEdited: boolean;
  setHoursEdited: (value: boolean) => void;
}

export function ServiceTab({ form, set, hoursEdited, setHoursEdited }: ServiceTabProps) {
  return (
    <div className="space-y-4">
      <SettingsToggle
        label="Open for orders"
        hint="Turn off to pause new orders temporarily, whatever your opening hours say."
        checked={form.isOpen}
        onChange={(v) => set("isOpen", v)}
      />
      <div className="pt-2">
        <h3 className="text-sm font-semibold text-neutral-900">Opening hours</h3>
        <p className="mb-3 mt-1 text-xs text-neutral-500">Customers see these on your page and can only order while you are open.</p>
        <OpeningHoursEditor
          value={form.openingHours || DEFAULT_HOURS}
          timezone={form.timezone}
          onChange={(hours) => { set("openingHours", hours); setHoursEdited(true); }}
          onTimezoneChange={(tz) => set("timezone", tz)}
        />
      </div>
      <SettingsToggle label="Delivery" checked={form.supportsDelivery} onChange={(v) => set("supportsDelivery", v)} />
      <SettingsToggle label="Pickup" checked={form.supportsPickup} onChange={(v) => set("supportsPickup", v)} />
      <SettingsToggle label="Dine-in" checked={form.supportsDineIn} onChange={(v) => set("supportsDineIn", v)} />
    </div>
  );
}