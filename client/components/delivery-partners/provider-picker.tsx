// components/delivery-partners/provider-picker.tsx
"use client";

import { FormEvent, useState } from "react";
import { ArrowLeft, Loader2, X } from "lucide-react";
import { useEscapeKey } from "@/hooks/use-escape-key";
import { useDialogFocus } from "@/hooks/use-dialog-focus";
import { OTHER_PROVIDER, PROVIDERS } from "@/lib/delivery-partner-providers";
import { ProviderBadge } from "@/components/delivery-partners/provider-badge";
import { Field, INPUT } from "@/components/delivery-partners/partner-modal";

interface ProviderPickerProps {
  pending: boolean;
  error: string;
  onPick: (name: string) => void;
  onClose: () => void;
}

export function ProviderPicker({ pending, error, onPick, onClose }: ProviderPickerProps) {
  useEscapeKey(onClose, !pending);
  const panelRef = useDialogFocus<HTMLDivElement>();
  const [custom, setCustom] = useState(false);
  const [name, setName] = useState("");

  function submitCustom(e: FormEvent) {
    e.preventDefault();
    onPick(name.trim());
  }

  return (
    <div role="dialog" aria-modal="true" aria-label="Choose a delivery service" className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div ref={panelRef} className="max-h-[92dvh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl transition duration-200 starting:scale-95 starting:opacity-0">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-start gap-2">
            {custom && (
              <button type="button" onClick={() => setCustom(false)} disabled={pending} aria-label="Back" className="mt-0.5 rounded-md p-1 text-neutral-500 hover:bg-neutral-100">
                <ArrowLeft size={18} />
              </button>
            )}
            <div>
              <h2 className="text-lg font-semibold text-neutral-900">{custom ? "Other delivery service" : "Choose a delivery service"}</h2>
              <p className="mt-0.5 text-sm text-neutral-500">{custom ? "What is the company called?" : "Pick the company that delivers your orders."}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} disabled={pending} aria-label="Close" className="rounded-md p-1.5 text-neutral-500 transition-colors hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900">
            <X size={18} />
          </button>
        </div>

        {custom ? (
          <form onSubmit={submitCustom} className="space-y-4">
            <Field label="Service name">
              <input required maxLength={100} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. City Couriers" className={INPUT} />
            </Field>
            {error && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
            <div className="flex justify-end">
              <button type="submit" disabled={pending || !name.trim()} className="flex min-h-11 items-center gap-2 rounded-lg bg-neutral-900 px-5 text-sm font-medium text-white transition-colors hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                {pending && <Loader2 size={14} className="animate-spin" />}
                Continue
              </button>
            </div>
          </form>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              {PROVIDERS.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  disabled={pending}
                  onClick={() => (p === OTHER_PROVIDER ? setCustom(true) : onPick(p.label))}
                  className="flex items-start gap-3 rounded-xl border border-neutral-200 p-3.5 text-left transition-colors hover:border-neutral-900 hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 disabled:opacity-60"
                >
                  <ProviderBadge provider={p} />
                  <span>
                    <span className="block text-sm font-semibold text-neutral-900">{p.label}</span>
                    <span className="block text-xs leading-snug text-neutral-500">{p.description}</span>
                    {p !== OTHER_PROVIDER && (
                      <span className="mt-2 inline-block whitespace-nowrap rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-600">
                        {p.kind === "courier" ? "Courier" : "Marketplace"}
                      </span>
                    )}
                  </span>
                </button>
              ))}
            </div>
            {error && <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
          </>
        )}
      </div>
    </div>
  );
}
