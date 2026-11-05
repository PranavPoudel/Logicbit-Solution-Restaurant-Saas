// components/owner-storefront/popup-usage.tsx
export function PopupUsage({ label, hint, used, limit }: { label: string; hint: string; used: number; limit: number }) {
  const full = used >= limit;
  return (
    <div
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={limit}
      aria-valuenow={used}
      className={`rounded-xl border p-4 ${full ? "border-amber-300 bg-amber-50" : "border-neutral-200 bg-white"}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-neutral-900">{label}</p>
          <p className="mt-0.5 text-xs text-neutral-500">{hint}</p>
        </div>
        <p className="shrink-0 text-2xl font-semibold leading-none text-neutral-900">
          {used}
          <span className="text-base font-medium text-neutral-400"> / {limit}</span>
        </p>
      </div>
      <div className="mt-3 flex gap-1.5" aria-hidden="true">
        {Array.from({ length: limit }, (_, i) => (
          <span key={i} className={`h-1.5 flex-1 rounded-full ${i < used ? (full ? "bg-amber-500" : "bg-[#1B2333]") : "bg-neutral-200"}`} />
        ))}
      </div>
      <p className={`mt-2 text-xs font-medium ${full ? "text-amber-800" : "text-neutral-500"}`}>
        {full ? "Limit reached. Turn one off to activate another." : `${limit - used} of ${limit} active slots free`}
      </p>
    </div>
  );
}