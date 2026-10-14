import { AlertTriangle } from "lucide-react";

export function AllergenNote({ text, dark = false }: { text?: string; dark?: boolean }) {
  if (!text) return null;
  return (
    <p
      role="note"
      className={`mt-2 flex items-start gap-2 rounded-lg border px-2.5 py-1.5 text-xs leading-snug ${
        dark ? "border-red-400/40 bg-red-500/15 text-red-200" : "border-red-200 bg-red-50 text-red-700"
      }`}
    >
      <AlertTriangle size={14} className="mt-px shrink-0" />
      <span>
        <span className="font-bold">Allergens:</span> <span className="font-medium">{text}</span>
      </span>
    </p>
  );
}
