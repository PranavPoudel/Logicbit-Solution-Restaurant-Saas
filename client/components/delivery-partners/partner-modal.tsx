// components/delivery-partners/partner-modal.tsx
"use client";

import { FormEvent, ReactNode, useState } from "react";
import { Loader2, X } from "lucide-react";
import { findProvider } from "@/lib/delivery-partner-providers";
import { ProviderBadge } from "@/components/delivery-partners/provider-badge";
import { useEscapeKey } from "@/hooks/use-escape-key";
import { useDialogFocus } from "@/hooks/use-dialog-focus";
import type { DeliveryPartner, DeliveryPartnerFeeType, DeliveryPartnerInput } from "@/lib/api/delivery-partners";

export const INPUT = "w-full rounded-lg border border-neutral-300 px-3.5 py-2.5 text-sm outline-none transition-colors placeholder:text-neutral-400 focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10";

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-neutral-800">{label}</label>
      {children}
    </div>
  );
}

interface PartnerModalProps {
  partner: DeliveryPartner;
  pending: boolean;
  error: string;
  onSave: (input: DeliveryPartnerInput) => void;
  onClose: () => void;
}

export function PartnerModal({ partner, pending, error, onSave, onClose }: PartnerModalProps) {
  useEscapeKey(onClose, !pending);
  const panelRef = useDialogFocus<HTMLDivElement>();
  const [contactName, setContactName] = useState(partner.contactName ?? "");
  const [contactPhone, setContactPhone] = useState(partner.contactPhone ?? "");
  const [accountId, setAccountId] = useState(partner.accountId ?? "");
  const [feeType, setFeeType] = useState<DeliveryPartnerFeeType>(partner.feeType ?? "PERCENT");
  const [feeValue, setFeeValue] = useState(String(partner.feeValue ?? ""));
  const [notes, setNotes] = useState(partner.notes ?? "");
  const [isActive, setIsActive] = useState(partner.isActive ?? true);

  const fee = Number(feeValue) || 0;
  const feeInvalid = feeType === "PERCENT" && fee > 100;

  function submit(e: FormEvent) {
    e.preventDefault();
    if (feeInvalid) return;
    onSave({
      name: partner.name,
      contactName: contactName.trim() || undefined,
      contactPhone: contactPhone.trim() || undefined,
      accountId: accountId.trim() || undefined,
      feeType,
      feeValue: fee,
      notes: notes.trim() || undefined,
      isActive,
    });
  }

  return (
    <div role="dialog" aria-modal="true" aria-label="Edit delivery service" className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div ref={panelRef} className="max-h-[92dvh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl transition duration-200 starting:scale-95 starting:opacity-0">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <ProviderBadge provider={findProvider(partner.name)} />
            <div>
              <h2 className="text-lg font-semibold text-neutral-900">Edit {partner.name}</h2>
              <p className="mt-0.5 text-sm text-neutral-500">Details for your records.</p>
            </div>
          </div>
          <button type="button" onClick={onClose} disabled={pending} aria-label="Close" className="rounded-md p-1.5 text-neutral-500 transition-colors hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Contact person">
              <input maxLength={100} value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="Optional" className={INPUT} />
            </Field>
            <Field label="Contact phone">
              <input maxLength={30} value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="Optional" className={INPUT} />
            </Field>
          </div>

          <Field label="Your account or merchant ID">
            <input maxLength={100} value={accountId} onChange={(e) => setAccountId(e.target.value)} placeholder="Optional" className={INPUT} />
          </Field>

          <Field label="Agreed fee (for your records)">
            <div className="flex gap-2">
              <select value={feeType} onChange={(e) => setFeeType(e.target.value as DeliveryPartnerFeeType)} className="rounded-lg border border-neutral-300 px-3 py-2.5 text-sm outline-none transition-colors focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10">
                <option value="PERCENT">% of the order</option>
                <option value="FLAT">Rs per delivery</option>
              </select>
              <input type="number" min={0} max={feeType === "PERCENT" ? 100 : undefined} step="any" value={feeValue} onChange={(e) => setFeeValue(e.target.value)} placeholder="0" className={INPUT} />
            </div>
            {feeInvalid && <p className="mt-1 text-xs text-red-600">A percentage cannot be more than 100.</p>}
          </Field>

          <Field label="Notes">
            <textarea rows={2} maxLength={500} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Weekday lunch only" className={INPUT} />
          </Field>

          <label className="flex cursor-pointer items-center gap-2 text-sm text-neutral-700">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-4 w-4 accent-neutral-900" />
            Active, this service currently delivers for us
          </label>

          {error && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} disabled={pending} className="min-h-11 rounded-lg border border-neutral-300 px-4 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900">
              Cancel
            </button>
            <button type="submit" disabled={pending || feeInvalid} className="flex min-h-11 items-center gap-2 rounded-lg bg-neutral-900 px-5 text-sm font-medium text-white transition-colors hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
              {pending && <Loader2 size={14} className="animate-spin" />}
              Save changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
