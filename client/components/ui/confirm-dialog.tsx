"use client";

import { useEscapeKey } from "@/hooks/use-escape-key";
import { useDialogFocus } from "@/hooks/use-dialog-focus";

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  destructive?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  cancelLabel,
  destructive = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  useEscapeKey(onClose);
  const panelRef = useDialogFocus<HTMLDivElement>();

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 transition-opacity duration-200 starting:opacity-0"
    >
      <div
        ref={panelRef}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl transition duration-200 starting:scale-95 starting:opacity-0"
      >
        <h2 className="font-display text-lg font-semibold text-[#17181C]">{title}</h2>
        <p className="mt-1.5 text-sm text-neutral-500">{message}</p>
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-[#E8E7E2] bg-white px-4 py-2.5 text-sm font-medium text-[#17181C] transition-colors hover:bg-neutral-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-medium text-white transition-colors ${
              destructive ? "bg-red-600 hover:bg-red-700" : "bg-[#17181C] hover:bg-[#2B2D33]"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
