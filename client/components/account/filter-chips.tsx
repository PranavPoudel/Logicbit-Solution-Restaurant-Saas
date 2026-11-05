// components/account/filter-chips.tsx
"use client";

import { Chip } from "@/components/ui/primitives";

interface FilterChipsProps<T extends string> {
  filters: ReadonlyArray<{ key: T; label: string; count?: number }>;
  active: T;
  onChange: (key: T) => void;
}

export function FilterChips<T extends string>({ filters, active, onChange }: FilterChipsProps<T>) {
  return (
    <div className="no-scrollbar flex gap-2 overflow-x-auto py-1">
      {filters.map((f) => (
        <Chip key={f.key} active={active === f.key} aria-pressed={active === f.key} onClick={() => onChange(f.key)}>
          {f.label}
          {f.count != null && <span className="ml-1.5 opacity-70">{f.count}</span>}
        </Chip>
      ))}
    </div>
  );
}
