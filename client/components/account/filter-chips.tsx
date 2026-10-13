// components/account/filter-chips.tsx
"use client";

interface FilterChipsProps<T extends string> {
  filters: ReadonlyArray<{ key: T; label: string; count?: number }>;
  active: T;
  onChange: (key: T) => void;
}

export function FilterChips<T extends string>({ filters, active, onChange }: FilterChipsProps<T>) {
  return (
    <div className="flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {filters.map((f) => (
        <button
          key={f.key}
          type="button"
          onClick={() => onChange(f.key)}
          aria-pressed={active === f.key}
          className={`shrink-0 rounded-full border px-4 min-h-10 text-sm font-medium transition-colors duration-200 ${
            active === f.key
              ? "border-[#17181C] bg-[#17181C] text-white"
              : "border-[#E8E7E2] bg-white text-neutral-600 hover:border-neutral-300"
          }`}
        >
          {f.label}
          {f.count != null && <span className="ml-1.5 opacity-60">{f.count}</span>}
        </button>
      ))}
    </div>
  );
}
