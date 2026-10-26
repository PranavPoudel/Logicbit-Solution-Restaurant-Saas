// components/delivery-partners/connect-modal.tsx
"use client";

import { FormEvent, useState } from "react";
import { ArrowLeft, ExternalLink, KeyRound, Loader2, Lock, X } from "lucide-react";
import { useEscapeKey } from "@/hooks/use-escape-key";
import { useDialogFocus } from "@/hooks/use-dialog-focus";
import { findProvider } from "@/lib/delivery-partner-providers";
import type { DeliveryPartner } from "@/lib/api/delivery-partners";
import { ProviderBadge } from "@/components/delivery-partners/provider-badge";
import { Field, INPUT } from "@/components/delivery-partners/partner-modal";

interface ConnectModalProps {
  partner: DeliveryPartner;
  pending: boolean;
  error: string;
  onConnect: (credentials: Record<string, string>) => void;
  onOAuth: () => void;
  onClose: () => void;
}

const OPTION = "flex w-full items-center gap-3 rounded-xl border border-neutral-200 p-4 text-left transition-colors hover:border-neutral-900 hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 disabled:opacity-60";

export function ConnectModal({ partner, pending, error, onConnect, onOAuth, onClose }: ConnectModalProps) {
  useEscapeKey(onClose, !pending);
  const panelRef = useDialogFocus<HTMLDivElement>();
  const provider = findProvider(partner.name);
  const both = provider.connect.length > 1;
  const [mode, setMode] = useState<"choose" | "keys">(both ? "choose" : "keys");
  const [values, setValues] = useState<Record<string, string>>({});

  function submit(e: FormEvent) {
    e.preventDefault();
    onConnect(values);
  }

  return (
    <div role="dialog" aria-modal="true" aria-label={`Connect ${partner.name}`} className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div ref={panelRef} className="max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-xl transition duration-200 starting:scale-95 starting:opacity-0">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-3">
            {mode === "keys" && both && (
              <button type="button" onClick={() => setMode("choose")} aria-label="Back" className="rounded-md p-1 text-neutral-500 transition-colors hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900">
                <ArrowLeft size={18} />
              </button>
            )}
            <ProviderBadge provider={provider} />
            <div>
              <h2 className="text-lg font-semibold text-neutral-900">Connect {partner.name}</h2>
              <p className="text-sm text-neutral-500">{mode === "choose" ? "Choose how you want to connect." : `Enter the details from your ${partner.name} account.`}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} disabled={pending} aria-label="Close" className="rounded-md p-1.5 text-neutral-500 transition-colors hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900">
            <X size={18} />
          </button>
        </div>

        {mode === "choose" ? (
          <div className="space-y-3">
            <button type="button" onClick={onOAuth} disabled={pending} className={OPTION}>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-neutral-700">
                {pending ? <Loader2 size={18} className="animate-spin" /> : <ExternalLink size={18} />}
              </span>
              <span>
                <span className="block text-sm font-semibold text-neutral-900">Continue with {partner.name}</span>
                <span className="block text-xs text-neutral-500">Log in on their website and approve access. We never see your password.</span>
              </span>
            </button>
            <button type="button" onClick={() => setMode("keys")} disabled={pending} className={OPTION}>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-neutral-700">
                <KeyRound size={18} />
              </span>
              <span>
                <span className="block text-sm font-semibold text-neutral-900">Enter API keys</span>
                <span className="block text-xs text-neutral-500">Paste the keys from your {partner.name} business dashboard.</span>
              </span>
            </button>
            {error && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            {provider.fields.map((f) => (
              <Field key={f.key} label={f.label}>
                <input
                  required
                  type={f.secret ? "password" : "text"}
                  autoComplete="off"
                  value={values[f.key] ?? ""}
                  onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                  className={INPUT}
                />
              </Field>
            ))}

            <p className="flex items-start gap-2 text-xs text-neutral-500">
              <Lock size={13} className="mt-0.5 shrink-0" />
              Your details are sent securely and never shown again after you connect.
            </p>

            {error && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={onClose} disabled={pending} className="min-h-11 rounded-lg border border-neutral-300 px-4 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900">
                Cancel
              </button>
              <button type="submit" disabled={pending} className="flex min-h-11 items-center gap-2 rounded-lg bg-neutral-900 px-5 text-sm font-medium text-white transition-colors hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                {pending && <Loader2 size={14} className="animate-spin" />}
                Connect
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
