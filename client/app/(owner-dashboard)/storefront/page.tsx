// app/(owner-dashboard)/storefront/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Trash2, GripVertical } from "lucide-react";
import { useOwnerAuthStore } from "@/store/owner-auth-store";
import {
  storefrontBannersApi,
  storefrontConfigApi,
  storefrontPopupsApi,
  type Banner,
  type StorefrontConfig,
  type StorefrontPopup,
} from "@/lib/api/storefront";

type Tab = "banners" | "config" | "popups";

function BannersTab({ restaurantId }: { restaurantId: string }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ imageUrl: "", title: "", subtitle: "", linkUrl: "" });

  const bannersQuery = useQuery({
    queryKey: ["storefront-banners", restaurantId],
    queryFn: () => storefrontBannersApi.list(restaurantId),
  });

  const createMutation = useMutation({
    mutationFn: () => storefrontBannersApi.create(restaurantId, form),
    onSuccess: () => {
      setForm({ imageUrl: "", title: "", subtitle: "", linkUrl: "" });
      queryClient.invalidateQueries({ queryKey: ["storefront-banners", restaurantId] });
    },
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => storefrontBannersApi.remove(restaurantId, id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["storefront-banners", restaurantId] }),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      storefrontBannersApi.update(restaurantId, id, { isActive }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["storefront-banners", restaurantId] }),
  });

  const moveMutation = useMutation({
    mutationFn: (orderedIds: string[]) => storefrontBannersApi.reorder(restaurantId, orderedIds),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["storefront-banners", restaurantId] }),
  });

  const banners = bannersQuery.data ?? [];

  function moveBanner(index: number, direction: -1 | 1) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= banners.length) return;
    const reordered = [...banners];
    [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];
    moveMutation.mutate(reordered.map((b) => b.id));
  }

  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (form.imageUrl.trim()) createMutation.mutate();
        }}
        className="border border-neutral-200 rounded-lg p-4 flex flex-col gap-3 mb-6"
      >
        <h2 className="text-sm font-semibold text-neutral-900">Add banner</h2>

        <input
          className="border border-neutral-300 rounded-md px-3 py-2 text-sm"
          placeholder="Image URL"
          value={form.imageUrl}
          onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
          required
        />
        <input
          className="border border-neutral-300 rounded-md px-3 py-2 text-sm"
          placeholder="Title (optional)"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
        />
        <input
          className="border border-neutral-300 rounded-md px-3 py-2 text-sm"
          placeholder="Subtitle (optional)"
          value={form.subtitle}
          onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))}
        />
        <input
          className="border border-neutral-300 rounded-md px-3 py-2 text-sm"
          placeholder="Link URL (optional)"
          value={form.linkUrl}
          onChange={(e) => setForm((f) => ({ ...f, linkUrl: e.target.value }))}
        />

        <button
          type="submit"
          disabled={createMutation.isPending}
          className="self-start bg-neutral-900 text-white text-sm font-medium rounded-md px-4 py-2 disabled:opacity-50"
        >
          Add banner
        </button>
      </form>

      {bannersQuery.isLoading ? (
        <p className="text-sm text-neutral-400">Loading banners...</p>
      ) : banners.length === 0 ? (
        <p className="text-sm text-neutral-400">No banners yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {banners.map((banner: Banner, index: number) => (
            <div
              key={banner.id}
              className="border border-neutral-200 rounded-lg p-3 flex items-center gap-3"
            >
              <div className="flex flex-col text-neutral-300">
                <button
                  type="button"
                  onClick={() => moveBanner(index, -1)}
                  disabled={index === 0}
                  className="disabled:opacity-30"
                  aria-label="Move up"
                >
                  ▲
                </button>
                <button
                  type="button"
                  onClick={() => moveBanner(index, 1)}
                  disabled={index === banners.length - 1}
                  className="disabled:opacity-30"
                  aria-label="Move down"
                >
                  ▼
                </button>
              </div>

              <img
                src={banner.imageUrl}
                alt=""
                className="w-16 h-10 object-cover rounded-md bg-neutral-100"
              />

              <div className="flex-1">
                <p className="text-sm font-medium text-neutral-900">
                  {banner.title || "Untitled banner"}
                </p>
                {banner.subtitle && (
                  <p className="text-xs text-neutral-500">{banner.subtitle}</p>
                )}
              </div>

              <label className="flex items-center gap-1.5 text-xs text-neutral-600">
                <input
                  type="checkbox"
                  checked={banner.isActive ?? true}
                  onChange={() =>
                    toggleActiveMutation.mutate({
                      id: banner.id,
                      isActive: !(banner.isActive ?? true),
                    })
                  }
                />
                Active
              </label>

              <button
                type="button"
                onClick={() => removeMutation.mutate(banner.id)}
                className="text-neutral-400 hover:text-red-500"
                aria-label="Delete banner"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ConfigTab({ restaurantId }: { restaurantId: string }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<StorefrontConfig | null>(null);
  const [saved, setSaved] = useState(false);

  const configQuery = useQuery({
    queryKey: ["storefront-config", restaurantId],
    queryFn: () => storefrontConfigApi.get(restaurantId),
  });

  useEffect(() => {
    if (configQuery.data) setForm(configQuery.data);
  }, [configQuery.data]);

  const updateMutation = useMutation({
    mutationFn: () =>
      storefrontConfigApi.update(restaurantId, {
        aboutText: form?.aboutText,
        contactPhone: form?.contactPhone,
        contactEmail: form?.contactEmail,
        contactAddress: form?.contactAddress,
      }),
    onSuccess: () => {
      setSaved(true);
      queryClient.invalidateQueries({ queryKey: ["storefront-config", restaurantId] });
      setTimeout(() => setSaved(false), 2000);
    },
  });

  if (configQuery.isLoading || !form) {
    return <p className="text-sm text-neutral-400">Loading...</p>;
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        updateMutation.mutate();
      }}
      className="flex flex-col gap-3"
    >
      <label className="text-sm font-medium text-neutral-700 flex flex-col gap-1">
        About text
        <textarea
          className="border border-neutral-300 rounded-md px-3 py-2 text-sm"
          rows={4}
          value={form.aboutText ?? ""}
          onChange={(e) => setForm((f) => (f ? { ...f, aboutText: e.target.value } : f))}
        />
      </label>

      <label className="text-sm font-medium text-neutral-700 flex flex-col gap-1">
        Contact phone
        <input
          className="border border-neutral-300 rounded-md px-3 py-2 text-sm"
          value={form.contactPhone ?? ""}
          onChange={(e) => setForm((f) => (f ? { ...f, contactPhone: e.target.value } : f))}
        />
      </label>

      <label className="text-sm font-medium text-neutral-700 flex flex-col gap-1">
        Contact email
        <input
          type="email"
          className="border border-neutral-300 rounded-md px-3 py-2 text-sm"
          value={form.contactEmail ?? ""}
          onChange={(e) => setForm((f) => (f ? { ...f, contactEmail: e.target.value } : f))}
        />
      </label>

      <label className="text-sm font-medium text-neutral-700 flex flex-col gap-1">
        Contact address
        <input
          className="border border-neutral-300 rounded-md px-3 py-2 text-sm"
          value={form.contactAddress ?? ""}
          onChange={(e) => setForm((f) => (f ? { ...f, contactAddress: e.target.value } : f))}
        />
      </label>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={updateMutation.isPending}
          className="self-start bg-neutral-900 text-white text-sm font-medium rounded-md px-4 py-2 disabled:opacity-50"
        >
          {updateMutation.isPending ? "Saving..." : "Save changes"}
        </button>
        {saved && <span className="text-xs text-green-600">Saved</span>}
      </div>
    </form>
  );
}

function PopupsTab({ restaurantId }: { restaurantId: string }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    title: "",
    message: "",
    imageUrl: "",
    ctaText: "",
    ctaLink: "",
    startDate: "",
    endDate: "",
  });

  const popupsQuery = useQuery({
    queryKey: ["storefront-popups", restaurantId],
    queryFn: () => storefrontPopupsApi.list(restaurantId),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      storefrontPopupsApi.create(restaurantId, {
        ...form,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
      }),
    onSuccess: () => {
      setForm({
        title: "",
        message: "",
        imageUrl: "",
        ctaText: "",
        ctaLink: "",
        startDate: "",
        endDate: "",
      });
      queryClient.invalidateQueries({ queryKey: ["storefront-popups", restaurantId] });
    },
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => storefrontPopupsApi.remove(restaurantId, id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["storefront-popups", restaurantId] }),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      storefrontPopupsApi.update(restaurantId, id, { isActive }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["storefront-popups", restaurantId] }),
  });

  const popups = popupsQuery.data ?? [];

  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (form.title.trim()) createMutation.mutate();
        }}
        className="border border-neutral-200 rounded-lg p-4 flex flex-col gap-3 mb-6"
      >
        <h2 className="text-sm font-semibold text-neutral-900">Add popup</h2>

        <input
          className="border border-neutral-300 rounded-md px-3 py-2 text-sm"
          placeholder="Title"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          required
        />
        <textarea
          className="border border-neutral-300 rounded-md px-3 py-2 text-sm"
          placeholder="Message"
          rows={2}
          value={form.message}
          onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
        />
        <input
          className="border border-neutral-300 rounded-md px-3 py-2 text-sm"
          placeholder="Image URL (optional)"
          value={form.imageUrl}
          onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
        />
        <div className="grid grid-cols-2 gap-3">
          <input
            className="border border-neutral-300 rounded-md px-3 py-2 text-sm"
            placeholder="Button text (optional)"
            value={form.ctaText}
            onChange={(e) => setForm((f) => ({ ...f, ctaText: e.target.value }))}
          />
          <input
            className="border border-neutral-300 rounded-md px-3 py-2 text-sm"
            placeholder="Button link (optional)"
            value={form.ctaLink}
            onChange={(e) => setForm((f) => ({ ...f, ctaLink: e.target.value }))}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-xs text-neutral-500 flex flex-col gap-1">
            Start date (optional)
            <input
              type="date"
              className="border border-neutral-300 rounded-md px-3 py-2 text-sm"
              value={form.startDate}
              onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
            />
          </label>
          <label className="text-xs text-neutral-500 flex flex-col gap-1">
            End date (optional)
            <input
              type="date"
              className="border border-neutral-300 rounded-md px-3 py-2 text-sm"
              value={form.endDate}
              onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={createMutation.isPending}
          className="self-start bg-neutral-900 text-white text-sm font-medium rounded-md px-4 py-2 disabled:opacity-50"
        >
          Add popup
        </button>
      </form>

      {popupsQuery.isLoading ? (
        <p className="text-sm text-neutral-400">Loading popups...</p>
      ) : popups.length === 0 ? (
        <p className="text-sm text-neutral-400">No popups yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {popups.map((popup: StorefrontPopup) => (
            <div
              key={popup.id}
              className="border border-neutral-200 rounded-lg p-3 flex items-center justify-between"
            >
              <div>
                <p className="text-sm font-medium text-neutral-900">{popup.title}</p>
                {popup.message && (
                  <p className="text-xs text-neutral-500">{popup.message}</p>
                )}
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 text-xs text-neutral-600">
                  <input
                    type="checkbox"
                    checked={popup.isActive ?? true}
                    onChange={() =>
                      toggleActiveMutation.mutate({
                        id: popup.id,
                        isActive: !(popup.isActive ?? true),
                      })
                    }
                  />
                  Active
                </label>
                <button
                  type="button"
                  onClick={() => removeMutation.mutate(popup.id)}
                  className="text-neutral-400 hover:text-red-500"
                  aria-label="Delete popup"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function StorefrontPage() {
  const restaurantId = useOwnerAuthStore((s) => s.activeRestaurantId);
  const [tab, setTab] = useState<Tab>("banners");

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

  const tabs: { key: Tab; label: string }[] = [
    { key: "banners", label: "Banners" },
    { key: "config", label: "About & Contact" },
    { key: "popups", label: "Popups" },
  ];

  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-semibold text-neutral-900 mb-1">Storefront</h1>
      <p className="text-sm text-neutral-500 mb-6">
        Build the public page customers see for your restaurant.
      </p>

      <div className="flex gap-1 border-b border-neutral-200 mb-6">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`text-sm font-medium px-3 py-2 border-b-2 -mb-px ${
              tab === t.key
                ? "border-neutral-900 text-neutral-900"
                : "border-transparent text-neutral-400"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "banners" && <BannersTab restaurantId={restaurantId} />}
      {tab === "config" && <ConfigTab restaurantId={restaurantId} />}
      {tab === "popups" && <PopupsTab restaurantId={restaurantId} />}
    </div>
  );
}
