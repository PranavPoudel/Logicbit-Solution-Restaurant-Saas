// components/ui/query-error.tsx
"use client";

import { AlertCircle, RotateCw } from "lucide-react";
import { getErrorMessage } from "@/lib/utils/error";

export function QueryError({ what, error, onRetry }: { what: string; error?: unknown; onRetry: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center gap-3 rounded-xl border border-red-100 bg-white px-6 py-12 text-center">
      <AlertCircle className="text-red-300" size={28} />
      <div>
        <p className="text-sm font-medium text-neutral-800">Couldn&apos;t load {what}.</p>
        <p className="mt-1 text-sm text-neutral-500">{getErrorMessage(error, "Check your connection and try again.", { includeErrorMessage: true })}</p>
      </div>
      <button type="button" onClick={onRetry} className="inline-flex items-center gap-2 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-700">
        <RotateCw size={14} /> Try again
      </button>
    </div>
  );
}
