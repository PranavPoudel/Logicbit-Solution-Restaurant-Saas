// app/(owner-dashboard)/advertising/page.tsx
"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import { useOwnerAuthStore } from "@/store/owner-auth-store";
import {
  requestAdvertisement,
  listRestaurantAdvertisements,
  type AdPlacementType,
  type Advertisement,
} from "@/lib/api/advertisements";

const PLACEMENT_OPTIONS: { value: AdPlacementType; label: string }[] = [
  { value: "HOMEPAGE_BANNER", label: "Homepage banner" },
  { value: "SEARCH_BOOST", label: "Search boost" },
  { value: "POPUP", label: "Popup ad" },
];

const STATUS_STYLES: Record<Advertisement["status"], string> = {
  PENDING: "bg-amber-100 text-amber-700",
  ACTIVE: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
};

const EMPTY_FORM = {
  placementType: "HOMEPAGE_BANNER" as AdPlacementType,
  title: "",
  imageUrl: "",
  linkUrl: "",
  startDate: "",
  endDate: "",
};

export default function AdvertisingPage() {
  const restaurantId = useOwnerAuthStore((s) => s.activeRestaurantId);
  const queryClient = useQueryClient();
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");

  const adsQuery = useQuery({
    queryKey: ["owner-advertisements", restaurantId],
    queryFn: () => listRestaurantAdvertisements(restaurantId as string),
    enabled: !!restaurantId,
  });

  const requestMutation = useMutation({
    mutationFn: () => requestAdvertisement(restaurantId as string, form),
    onSuccess: () => {
      setForm(EMPTY_FORM);
      setError("");
      queryClient.invalidateQueries({ queryKey: ["owner-advertisements", restaurantId] });
    },
    onError: (err: any) => {
      setError(err?.response?.data?.message || "Could not submit the ad request.");
    },
  });

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

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (new Date(form.endDate) <= new Date(form.startDate)) {
      setError("End date must be after start date.");
      return;
    }
    requestMutation.mutate();
  }

  const ads = adsQuery.data ?? [];

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold text-neutral-900 mb-1">Advertising</h1>
      <p className="text-sm text-neutral-500 mb-6">
        Request paid placement for your restaurant. Requests are reviewed by our
        team before going live.
      </p>

      <form
        onSubmit={handleSubmit}
        className="border border-neutral-200 rounded-lg p-4 flex flex-col gap-3 mb-8"
      >
        <h2 className="text-sm font-semibold text-neutral-900">New ad request</h2>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <label className="text-sm font-medium text-neutral-700 flex flex-col gap-1">
          Placement
          <select
            className="border border-neutral-300 rounded-md px-3 py-2 text-sm"
            value={form.placementType}
            onChange={(e) =>
              setForm((f) => ({ ...f, placementType: e.target.value as AdPlacementType }))
            }
          >
            {PLACEMENT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm font-medium text-neutral-700 flex flex-col gap-1">
          Title
          <input
            className="border border-neutral-300 rounded-md px-3 py-2 text-sm"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="e.g. Weekend Special Feature"
            required
          />
        </label>

        <label className="text-sm font-medium text-neutral-700 flex flex-col gap-1">
          Image URL
          <input
            className="border border-neutral-300 rounded-md px-3 py-2 text-sm"
            value={form.imageUrl}
            onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
            placeholder="https://..."
          />
        </label>

        <label className="text-sm font-medium text-neutral-700 flex flex-col gap-1">
          Link URL
          <input
            className="border border-neutral-300 rounded-md px-3 py-2 text-sm"
            value={form.linkUrl}
            onChange={(e) => setForm((f) => ({ ...f, linkUrl: e.target.value }))}
            placeholder="Where the ad should link to"
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm font-medium text-neutral-700 flex flex-col gap-1">
            Start date
            <input
              type="date"
              className="border border-neutral-300 rounded-md px-3 py-2 text-sm"
              value={form.startDate}
              onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
              required
            />
          </label>
          <label className="text-sm font-medium text-neutral-700 flex flex-col gap-1">
            End date
            <input
              type="date"
              className="border border-neutral-300 rounded-md px-3 py-2 text-sm"
              value={form.endDate}
              onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
              required
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={requestMutation.isPending}
          className="self-start bg-neutral-900 text-white text-sm font-medium rounded-md px-4 py-2 disabled:opacity-50"
        >
          {requestMutation.isPending ? "Submitting..." : "Submit request"}
        </button>
      </form>

      <h2 className="text-sm font-semibold text-neutral-900 mb-3">Your ad requests</h2>

      {adsQuery.isLoading ? (
        <p className="text-sm text-neutral-400">Loading...</p>
      ) : ads.length === 0 ? (
        <p className="text-sm text-neutral-400">No ad requests yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {ads.map((ad) => (
            <div
              key={ad.id}
              className="border border-neutral-200 rounded-lg p-3 flex items-center justify-between"
            >
              <div>
                <p className="text-sm font-medium text-neutral-900">{ad.title}</p>
                <p className="text-xs text-neutral-500">
                  {ad.placementType.replace("_", " ")} · {ad.startDate?.slice(0, 10)} →{" "}
                  {ad.endDate?.slice(0, 10)}
                </p>
                {ad.status === "REJECTED" && ad.rejectionReason && (
                  <p className="text-xs text-red-500 mt-1">Reason: {ad.rejectionReason}</p>
                )}
              </div>
              <span
                className={`text-xs font-medium rounded-full px-2.5 py-1 ${STATUS_STYLES[ad.status]}`}
              >
                {ad.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
