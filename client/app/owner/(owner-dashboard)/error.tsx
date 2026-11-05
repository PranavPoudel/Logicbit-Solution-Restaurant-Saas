// app/owner/(owner-dashboard)/error.tsx
"use client";

import { AlertTriangle } from "lucide-react";

export default function OwnerError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div role="alert" className="mx-auto flex max-w-md flex-col items-center gap-4 py-24 text-center">
      <AlertTriangle className="text-red-300" size={36} />
      <div>
        <h1 className="text-lg font-semibold text-neutral-900">Something went wrong</h1>
        <p className="mt-1 text-sm text-neutral-500">{error.message || "This page hit an unexpected error."}</p>
      </div>
      <button type="button" onClick={reset} className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-700">
        Try again
      </button>
    </div>
  );
}
