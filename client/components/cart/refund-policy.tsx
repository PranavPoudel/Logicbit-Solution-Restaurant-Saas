import { ChevronDown } from "lucide-react";

export function RefundPolicy({ text }: { text?: string | null }) {
  if (!text) return null;
  return (
    <details className="group rounded-xl border border-[#E8E7E2] bg-white text-sm">
      <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 font-medium text-[#17181C] [&::-webkit-details-marker]:hidden">
        Refund policy
        <ChevronDown size={16} className="text-neutral-400 transition-transform group-open:rotate-180" />
      </summary>
      <p className="whitespace-pre-line border-t border-[#E8E7E2] px-4 py-3 text-xs leading-relaxed text-neutral-600">
        {text}
      </p>
    </details>
  );
}
