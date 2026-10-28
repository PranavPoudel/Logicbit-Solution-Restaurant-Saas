"use client";

import { SettingsField } from "@/components/owner-settings/settings-field";
import { SettingsForm } from "@/app/owner/(owner-dashboard)/settings/page";

interface BrandingTabProps {
  form: SettingsForm;
  set: <K extends keyof SettingsForm>(key: K, value: SettingsForm[K]) => void;
}

export function BrandingTab({ form, set }: BrandingTabProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">Primary color</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={form.primaryColor}
              onChange={(e) => set("primaryColor", e.target.value)}
              className="w-10 h-10 rounded-lg border border-neutral-200 cursor-pointer"
            />
            <span className="text-sm font-mono text-neutral-500">{form.primaryColor}</span>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">Secondary color</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={form.secondaryColor}
              onChange={(e) => set("secondaryColor", e.target.value)}
              className="w-10 h-10 rounded-lg border border-neutral-200 cursor-pointer"
            />
            <span className="text-sm font-mono text-neutral-500">{form.secondaryColor}</span>
          </div>
        </div>
      </div>
      <SettingsField
        label="Hero heading"
        value={form.heroHeading}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => set("heroHeading", e.target.value)}
        placeholder="e.g. Authentic Newari food, made fresh"
      />
      <SettingsField
        label="Hero subheading"
        value={form.heroSubheading}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => set("heroSubheading", e.target.value)}
      />
    </div>
  );
}