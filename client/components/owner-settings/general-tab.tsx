"use client";

import { useQuery } from "@tanstack/react-query";
import { listCities } from "@/lib/api/cities";
import { SettingsField, SettingsTextarea } from "@/components/owner-settings/settings-field";
import { SettingsForm } from "@/app/owner/(owner-dashboard)/settings/page";

interface GeneralTabProps {
  form: SettingsForm;
  // ✅ FIXED: Strict generic signature matching the parent
  set: <K extends keyof SettingsForm>(key: K, value: SettingsForm[K]) => void;
  allCuisines: { id: string; name: string }[] | undefined;
  isLoadingCuisines: boolean;
  selectedCuisineIds: string[];
  toggleCuisine: (id: string) => void;
  isUpdatingCuisines: boolean;
}

export function GeneralTab({ form, set, allCuisines, isLoadingCuisines, selectedCuisineIds, toggleCuisine, isUpdatingCuisines }: GeneralTabProps) {
  const { data: cities = [] } = useQuery({ queryKey: ["cities"], queryFn: listCities });
  const listed = cities.some((c) => c.name.toLowerCase() === form.city.trim().toLowerCase());
  return (
    <div className="space-y-4">
      <SettingsField label="Restaurant name" value={form.name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => set("name", e.target.value)} />
      <SettingsField label="Address" value={form.address} onChange={(e: React.ChangeEvent<HTMLInputElement>) => set("address", e.target.value)} />
      <SettingsField label="Phone number" type="tel" value={form.phone} onChange={(e: React.ChangeEvent<HTMLInputElement>) => set("phone", e.target.value)} />
      <div>
        <label htmlFor="restaurant-city" className="block text-sm font-medium text-neutral-700 mb-1.5">City</label>
        <select
          id="restaurant-city"
          value={form.city}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => set("city", e.target.value)}
          className="w-full bg-white border border-neutral-200 rounded-lg px-3.5 py-2.5 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#E3A008]/40 focus:border-[#E3A008]"
        >
          <option value="">Select your city</option>
          {form.city && !listed && <option value={form.city}>{form.city} (not a listed city)</option>}
          {cities.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
        </select>
        <p className="text-xs text-neutral-400 mt-1">Customers find your restaurant under this city. Missing yours? Ask the platform admin to add it.</p>
      </div>
      <SettingsTextarea
        id="refund-policy"
        label="Refund policy"
        hint="Shown to customers at checkout and on their order page."
        maxLength={1000}
        placeholder="e.g. Full refund if cancelled before the kitchen starts preparing."
        value={form.refundPolicy}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => set("refundPolicy", e.target.value)}
      />

      <div className="pt-4 border-t border-neutral-100">
        <label className="block text-sm font-medium text-neutral-700 mb-2">Cuisines</label>
        <p className="text-xs text-neutral-500 mb-3">Select the types of food your restaurant serves. This helps customers find you.</p>
        
        {isLoadingCuisines ? (
          <p className="text-xs text-neutral-400">Loading cuisines...</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {allCuisines?.map((cuisine) => {
              const isSelected = selectedCuisineIds.includes(cuisine.id);
              return (
                <button
                  key={cuisine.id}
                  type="button"
                  onClick={() => toggleCuisine(cuisine.id)}
                  disabled={isUpdatingCuisines}
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
    </div>
  );
}