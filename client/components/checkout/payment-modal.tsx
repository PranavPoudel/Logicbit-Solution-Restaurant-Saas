"use client";

import { AlertCircle, Banknote, CreditCard, Loader2, QrCode, Smartphone, X } from "lucide-react";
import { useEscapeKey } from "@/hooks/use-escape-key";
import { useDialogFocus } from "@/hooks/use-dialog-focus";
import type { CheckoutInput } from "@/lib/api/orders";

export type PaymentMethod = CheckoutInput["paymentMethod"];

const OPTIONS: Array<{ id: PaymentMethod; label: string; Icon: typeof Banknote }> = [
  { id: "COD", label: "Cash on Delivery", Icon: Banknote },
  { id: "CREDIT_CARD", label: "Card", Icon: CreditCard },
  { id: "ESEWA", label: "eSewa", Icon: Smartphone },
  { id: "PAYPAY", label: "PayPay", Icon: QrCode },
];

interface PaymentModalProps {
  total: number;
  pending: boolean;
  error: string;
  onSelect: (method: PaymentMethod) => void;
  onClose: () => void;
}

export function PaymentModal({ total, pending, error, onSelect, onClose }: PaymentModalProps) {
  useEscapeKey(onClose, !pending);
  const panelRef = useDialogFocus<HTMLDivElement>();

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Choose payment method"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 transition-opacity duration-200 starting:opacity-0"
    >
      <div ref={panelRef} className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl transition duration-200 starting:scale-95 starting:opacity-0">
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h2 className="font-display text-lg font-semibold text-[#17181C]">How would you like to pay?</h2>
            <p className="mt-0.5 text-sm text-neutral-500">Total: Rs {total}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            aria-label="Close"
            className="rounded-md p-1.5 text-neutral-500 transition-colors hover:bg-neutral-100 disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {OPTIONS.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              disabled={pending}
              onClick={() => onSelect(id)}
              className="flex flex-col items-center gap-2 rounded-2xl border border-[#E8E7E2] px-3 py-6 text-sm font-medium text-[#17181C] transition-colors hover:border-[#17181C] hover:bg-[#17181C] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Icon size={28} />
              {label}
            </button>
          ))}
        </div>

        {pending && (
          <p className="mt-4 flex items-center justify-center gap-2 text-sm text-neutral-500">
            <Loader2 size={14} className="animate-spin" /> Processing…
          </p>
        )}
        {error && (
          <div role="alert" className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
}
