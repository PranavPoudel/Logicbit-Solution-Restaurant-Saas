// app/owner/(owner-dashboard)/not-found.tsx
import Link from "next/link";
import { FileQuestion } from "lucide-react";

export default function OwnerNotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-24 text-center">
      <FileQuestion className="text-neutral-300" size={36} />
      <div>
        <h1 className="text-lg font-semibold text-neutral-900">Page not found</h1>
        <p className="mt-1 text-sm text-neutral-500">This page doesn&apos;t exist or has moved.</p>
      </div>
      <Link href="/owner/dashboard" className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-700">
        Back to dashboard
      </Link>
    </div>
  );
}
