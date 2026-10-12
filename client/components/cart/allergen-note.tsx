import { AlertTriangle } from "lucide-react";

export function AllergenNote({ text, dark = false }: { text?: string; dark?: boolean }) {
  if (!text) return null;
  return (
    <p className={`mt-0.5 flex items-center gap-1 text-[11px] font-medium ${dark ? "text-red-300" : "text-red-600"}`}>
      <AlertTriangle size={11} className="shrink-0" /> Allergens: {text}
    </p>
  );
}
