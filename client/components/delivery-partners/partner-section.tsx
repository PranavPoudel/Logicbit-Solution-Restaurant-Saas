// components/delivery-partners/partner-section.tsx
"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, BadgePercent, CheckCircle2, Pencil, Phone, Plus, Trash2, Truck, X } from "lucide-react";
import { useOwnerAuthStore } from "@/store/owner-auth-store";
import {
  connectionErrorMessage,
  deliveryPartnersApi,
  type ConnectionStatus,
  type DeliveryPartner,
  type DeliveryPartnerInput,
} from "@/lib/api/delivery-partners";
import { findProvider, formatPartnerFee } from "@/lib/delivery-partner-providers";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { PartnerModal } from "@/components/delivery-partners/partner-modal";
import { ProviderPicker } from "@/components/delivery-partners/provider-picker";
import { ConnectModal } from "@/components/delivery-partners/connect-modal";
import { ProviderBadge } from "@/components/delivery-partners/provider-badge";
import { Switch } from "@/components/delivery-partners/switch";

const CONNECTION: Record<ConnectionStatus, { label: string; chip: string; dot: string }> = {
  CONNECTED: { label: "Connected", chip: "bg-green-50 text-green-700", dot: "bg-green-500" },
  FAILED: { label: "Connection failed", chip: "bg-red-50 text-red-700", dot: "bg-red-500" },
  NOT_CONNECTED: { label: "Not connected", chip: "bg-amber-50 text-amber-700", dot: "bg-amber-500" },
};

const BANNER_STYLE = {
  ok: "border-green-200 bg-green-50 text-green-800",
  info: "border-neutral-200 bg-neutral-50 text-neutral-700",
  error: "border-red-200 bg-red-50 text-red-700",
};

const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2";
const PRIMARY = `rounded-lg bg-neutral-900 font-medium text-white transition-colors hover:bg-neutral-800 ${FOCUS}`;
const GHOST = `min-h-9 rounded-lg px-3 text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-100 disabled:opacity-50 ${FOCUS}`;
const ICON_BTN = `flex h-9 w-9 items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 ${FOCUS}`;

type Banner = { tone: keyof typeof BANNER_STYLE; text: string };

export function PartnerSection() {
  const restaurantId = useOwnerAuthStore((s) => s.activeRestaurantId);
  const queryClient = useQueryClient();
  const router = useRouter();
  const params = useSearchParams();
  const returned = params.get("connection");
  const returnedMessage = params.get("message");
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<DeliveryPartner | null>(null);
  const [connecting, setConnecting] = useState<DeliveryPartner | null>(null);
  const [removing, setRemoving] = useState<DeliveryPartner | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState<Banner | null>(null);

  const { data: partners = [], isLoading } = useQuery({
    queryKey: ["delivery-partners", restaurantId],
    queryFn: () => deliveryPartnersApi.list(restaurantId!),
    enabled: !!restaurantId,
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["delivery-partners", restaurantId] });

  const onSaveError = (e: { response?: { data?: { message?: string | string[] } } }) => {
    const message = e.response?.data?.message;
    setError(Array.isArray(message) ? message.join(", ") : message || "Could not save. Please try again.");
  };

  const openConnect = (p: DeliveryPartner) => {
    setError("");
    setConnecting(p);
  };

  const create = useMutation({
    mutationFn: (name: string) => deliveryPartnersApi.create(restaurantId!, { name }),
    onSuccess: (created: DeliveryPartner) => {
      setAdding(false);
      refresh();
      openConnect(created);
    },
    onError: onSaveError,
  });

  const save = useMutation({
    mutationFn: (input: DeliveryPartnerInput) => deliveryPartnersApi.update(restaurantId!, editing!.id, input),
    onSuccess: () => {
      setNotice({ tone: "ok", text: `${editing!.name} was updated.` });
      setEditing(null);
      refresh();
    },
    onError: onSaveError,
  });

  const toggle = useMutation({
    mutationFn: (p: DeliveryPartner) => deliveryPartnersApi.update(restaurantId!, p.id, { isActive: !p.isActive }),
    onSuccess: refresh,
  });

  const remove = useMutation({
    mutationFn: (p: DeliveryPartner) => deliveryPartnersApi.remove(restaurantId!, p.id),
    onSuccess: (_, p) => {
      setRemoving(null);
      setNotice({ tone: "ok", text: `${p.name} was removed.` });
      refresh();
    },
  });

  const connect = useMutation({
    mutationFn: (credentials: Record<string, string>) => deliveryPartnersApi.connect(restaurantId!, connecting!.id, credentials),
    onSuccess: () => {
      setNotice({ tone: "ok", text: `${connecting!.name} is connected.` });
      setConnecting(null);
      refresh();
    },
    onError: (e: Parameters<typeof connectionErrorMessage>[0]) => setError(connectionErrorMessage(e)),
  });

  const oauth = useMutation({
    mutationFn: () => deliveryPartnersApi.oauthStart(restaurantId!, connecting!.id),
    onSuccess: ({ url }) => window.location.assign(url),
    onError: (e: Parameters<typeof connectionErrorMessage>[0]) => setError(connectionErrorMessage(e)),
  });

  const test = useMutation({
    mutationFn: (p: DeliveryPartner) => deliveryPartnersApi.testConnection(restaurantId!, p.id),
    onSuccess: (result, p) => {
      setNotice(
        result.status === "CONNECTED"
          ? { tone: "ok", text: `${p.name} is connected and working.` }
          : { tone: "info", text: result.message || `${p.name} could not be reached.` },
      );
      refresh();
    },
    onError: (e: Parameters<typeof connectionErrorMessage>[0]) => setNotice({ tone: "info", text: connectionErrorMessage(e) }),
  });

  const disconnect = useMutation({
    mutationFn: (p: DeliveryPartner) => deliveryPartnersApi.disconnect(restaurantId!, p.id),
    onSuccess: refresh,
    onError: (e: Parameters<typeof connectionErrorMessage>[0]) => setNotice({ tone: "info", text: connectionErrorMessage(e) }),
  });

  const openAdd = () => {
    setError("");
    setAdding(true);
  };

  const openEdit = (p: DeliveryPartner) => {
    setError("");
    setEditing(p);
  };

  const banner: (Banner & { close: () => void }) | null = returned
    ? {
        tone: returned === "connected" ? "ok" : "error",
        text: returned === "connected" ? "Connected successfully." : returnedMessage || "The connection was not completed.",
        close: () => router.replace("/owner/delivery-persons"),
      }
    : notice && { ...notice, close: () => setNotice(null) };

  return (
    <section aria-labelledby="delivery-services-title" className="rounded-xl border border-neutral-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200 px-6 py-5">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 text-neutral-700">
            <Truck size={20} />
          </span>
          <div>
            <h2 id="delivery-services-title" className="text-base font-semibold text-neutral-900">
              Delivery Services
            </h2>
            <p className="text-sm text-neutral-500">Companies like Uber Eats or Pathao that deliver your orders.</p>
          </div>
        </div>
        <button type="button" onClick={openAdd} className={`${PRIMARY} flex min-h-10 items-center gap-1.5 px-4 text-sm`}>
          <Plus size={16} /> Add Delivery Service
        </button>
      </div>

      {banner && (
        <p role="status" className={`mx-6 mt-4 flex items-start gap-2 rounded-lg border px-3 py-2.5 text-sm ${BANNER_STYLE[banner.tone]}`}>
          {banner.tone === "ok" ? <CheckCircle2 size={16} className="mt-0.5 shrink-0" /> : <AlertCircle size={16} className="mt-0.5 shrink-0" />}
          <span className="flex-1">{banner.text}</span>
          <button type="button" onClick={banner.close} aria-label="Dismiss" className="rounded p-0.5 opacity-60 hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900">
            <X size={14} />
          </button>
        </p>
      )}

      {isLoading ? (
        <ul aria-busy="true" className="divide-y divide-neutral-100">
          {[0, 1].map((i) => (
            <li key={i} className="flex animate-pulse items-center gap-4 px-6 py-5">
              <span className="h-11 w-11 rounded-xl bg-neutral-100" />
              <span className="flex-1 space-y-2">
                <span className="block h-3.5 w-40 rounded bg-neutral-100" />
                <span className="block h-3 w-64 rounded bg-neutral-100" />
              </span>
            </li>
          ))}
        </ul>
      ) : partners.length === 0 ? (
        <div className="flex flex-col items-center px-6 py-12 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-500">
            <Truck size={26} />
          </span>
          <h3 className="mt-4 text-base font-semibold text-neutral-900">No delivery services yet</h3>
          <p className="mt-1 max-w-sm text-sm text-neutral-500">Add the companies that deliver for you, then connect your account so orders can be handed over.</p>
          <button type="button" onClick={openAdd} className={`${PRIMARY} mt-5 flex min-h-10 items-center gap-1.5 px-4 text-sm`}>
            <Plus size={16} /> Add your first service
          </button>
        </div>
      ) : (
        <ul className="divide-y divide-neutral-100">
          {partners.map((p) => {
            const provider = findProvider(p.name);
            const status = CONNECTION[p.connectionStatus ?? "NOT_CONNECTED"];
            const connected = p.connectionStatus === "CONNECTED";
            return (
              <li key={p.id} className="flex flex-wrap items-center gap-x-4 gap-y-3 px-6 py-5">
                <ProviderBadge provider={provider} size={44} />

                <div className="min-w-0 flex-1 basis-60">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-neutral-900">{p.name}</p>
                    <span className="whitespace-nowrap rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-600">{provider.kind === "courier" ? "Courier" : "Marketplace"}</span>
                    <span className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium ${status.chip}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                      {status.label}
                    </span>
                  </div>
                  <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-0.5 text-xs text-neutral-500">
                    <span className="flex items-center gap-1">
                      <BadgePercent size={12} /> {formatPartnerFee(p)}
                    </span>
                    {p.contactName && <span>{p.contactName}</span>}
                    {p.contactPhone && (
                      <span className="flex items-center gap-1">
                        <Phone size={12} /> {p.contactPhone}
                      </span>
                    )}
                    {p.accountId && <span>ID {p.accountId}</span>}
                  </p>
                  {p.connectionStatus === "FAILED" && p.connectionError && <p className="mt-1 text-xs text-red-600">{p.connectionError}</p>}
                  {p.notes && <p className="mt-1 text-xs text-neutral-400">{p.notes}</p>}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {connected ? (
                    <>
                      <button type="button" onClick={() => test.mutate(p)} disabled={test.isPending} className={GHOST}>
                        Test connection
                      </button>
                      <button type="button" onClick={() => disconnect.mutate(p)} disabled={disconnect.isPending} className={GHOST}>
                        Disconnect
                      </button>
                    </>
                  ) : (
                    <button type="button" onClick={() => openConnect(p)} className={`${PRIMARY} min-h-9 px-4 text-xs`}>
                      Connect
                    </button>
                  )}
                  <span className="mx-1 hidden h-6 w-px bg-neutral-200 sm:block" />
                  <label className="flex items-center gap-2 text-xs text-neutral-500">
                    <Switch checked={p.isActive} label={`${p.name} is ${p.isActive ? "active" : "inactive"}`} disabled={toggle.isPending} onChange={() => toggle.mutate(p)} />
                    {p.isActive ? "Active" : "Off"}
                  </label>
                  <button type="button" onClick={() => openEdit(p)} aria-label={`Edit ${p.name}`} title="Edit" className={ICON_BTN}>
                    <Pencil size={16} />
                  </button>
                  <button type="button" onClick={() => setRemoving(p)} aria-label={`Remove ${p.name}`} title="Remove" className={`${ICON_BTN} hover:bg-red-50 hover:text-red-600`}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {adding && <ProviderPicker pending={create.isPending} error={error} onPick={(name) => create.mutate(name)} onClose={() => setAdding(false)} />}

      {editing && <PartnerModal partner={editing} pending={save.isPending} error={error} onSave={(input) => save.mutate(input)} onClose={() => setEditing(null)} />}

      {connecting && (
        <ConnectModal
          partner={connecting}
          pending={connect.isPending || oauth.isPending}
          error={error}
          onConnect={(credentials) => connect.mutate(credentials)}
          onOAuth={() => oauth.mutate()}
          onClose={() => setConnecting(null)}
        />
      )}

      {removing && (
        <ConfirmDialog
          title={`Remove ${removing.name}?`}
          message="It will no longer appear in your delivery services. You can add it again anytime."
          confirmLabel="Remove"
          pending={remove.isPending}
          onConfirm={() => remove.mutate(removing)}
          onCancel={() => setRemoving(null)}
        />
      )}
    </section>
  );
}
