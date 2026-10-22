// components/ui/confirm-dialog.tsx
"use client";

import { Loader2, Trash2 } from "lucide-react";
import { useEscapeKey } from "@/hooks/use-escape-key";
import { useDialogFocus } from "@/hooks/use-dialog-focus";

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel: string;
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ title, message, confirmLabel, pending = false, onConfirm, onCancel }: ConfirmDialogProps) {
  useEscapeKey(onCancel, !pending);
  const panelRef = useDialogFocus<HTMLDivElement>();

  return (
    <div role="alertdialog" aria-modal="true" aria-label={title} className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
      <div ref={panelRef} className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl transition duration-200 starting:scale-95 starting:opacity-0">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-red-50 text-red-600">
          <Trash2 size={20} />
        </span>
        <h2 className="mt-4 text-lg font-semibold text-neutral-900">{title}</h2>
        <p className="mt-1 text-sm text-neutral-500">{message}</p>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onCancel} disabled={pending} className="min-h-11 rounded-lg border border-neutral-300 px-4 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900">
            Cancel
          </button>
          <button type="button" onClick={onConfirm} disabled={pending} className="flex min-h-11 items-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-medium text-white transition-colors hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2 disabled:opacity-60">
            {pending && <Loader2 size={14} className="animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
