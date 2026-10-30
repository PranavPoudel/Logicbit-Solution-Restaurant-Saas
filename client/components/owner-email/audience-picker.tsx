// components/owner-email/audience-picker.tsx
"use client";

import { useMemo, useState } from "react";
import { Check, Search, User, Users } from "lucide-react";
import type { EmailCustomer } from "@/lib/api/owner-emails";

export type Audience = "ALL" | "ONE";

interface AudiencePickerProps {
  audience: Audience;
  onAudienceChange: (audience: Audience) => void;
  customers: EmailCustomer[];
  isLoading: boolean;
  customerId: string;
  onCustomerChange: (id: string) => void;
  customerError?: string;
  onCustomerBlur: () => void;
}

const ring =
  "outline-none focus-visible:ring-2 focus-visible:ring-[#E3A008] focus-visible:ring-offset-2";

export function AudiencePicker({
  audience,
  onAudienceChange,
  customers,
  isLoading,
  customerId,
  onCustomerChange,
  customerError,
  onCustomerBlur,
}: AudiencePickerProps) {
  const [query, setQuery] = useState("");

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q),
    );
  }, [customers, query]);

  const options = [
    { value: "ALL", label: "All customers", hint: `${customers.length} ${customers.length === 1 ? "person" : "people"}`, icon: Users },
    { value: "ONE", label: "One customer", hint: "Pick a person", icon: User },
  ] as const;

  return (
    <fieldset className="min-w-0 space-y-3">
      <legend className="text-sm font-semibold text-neutral-900">Who should get this?</legend>

      <div role="radiogroup" aria-label="Audience" className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {options.map(({ value, label, hint, icon: Icon }) => {
          const active = audience === value;
          return (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onAudienceChange(value)}
              className={`flex min-h-14 items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors motion-reduce:transition-none ${ring} ${
                active
                  ? "border-[#E3A008] bg-[#E3A008]/10"
                  : "border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50"
              }`}
            >
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                  active ? "bg-[#111827] text-white" : "bg-neutral-100 text-neutral-500"
                }`}
              >
                <Icon size={18} aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-medium text-neutral-900">{label}</span>
                <span className="block text-xs text-neutral-500">{hint}</span>
              </span>
            </button>
          );
        })}
      </div>

      {audience === "ONE" && (
        <div className="space-y-2 rounded-xl border border-neutral-200 p-3">
          <div className="relative">
            <Search
              size={16}
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
            />
            <input
              id="email-customer-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or email"
              aria-label="Search customers"
              className={`min-h-11 w-full rounded-lg border border-neutral-200 bg-neutral-50 pl-9 pr-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:bg-white ${ring}`}
            />
          </div>

          <ul
            role="radiogroup"
            aria-label="Customers"
            aria-invalid={!!customerError}
            aria-describedby={customerError ? "email-customer-error" : undefined}
            className="max-h-56 space-y-1 overflow-y-auto"
          >
            {isLoading &&
              [0, 1, 2].map((i) => (
                <li key={i} className="h-12 animate-pulse rounded-lg bg-neutral-100 motion-reduce:animate-none" />
              ))}

            {!isLoading &&
              matches.map((c) => {
                const selected = c.id === customerId;
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => onCustomerChange(c.id)}
                      onBlur={onCustomerBlur}
                      className={`flex min-h-12 w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors motion-reduce:transition-none ${ring} ${
                        selected ? "bg-[#111827] text-white" : "hover:bg-neutral-50"
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                          selected ? "bg-[#E3A008] text-[#111827]" : "bg-neutral-100 text-neutral-600"
                        }`}
                      >
                        {c.name.charAt(0)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{c.name}</span>
                        <span className={`block truncate text-xs ${selected ? "text-white/70" : "text-neutral-500"}`}>
                          {c.email}
                        </span>
                      </span>
                      <span className={`shrink-0 text-xs ${selected ? "text-white/70" : "text-neutral-400"}`}>
                        {c.orders} {c.orders === 1 ? "order" : "orders"}
                      </span>
                      {selected && <Check size={16} aria-hidden="true" className="shrink-0 text-[#E3A008]" />}
                    </button>
                  </li>
                );
              })}

            {!isLoading && matches.length === 0 && (
              <li className="px-3 py-6 text-center text-sm text-neutral-500">
                {customers.length === 0
                  ? "No customers yet. They appear here after their first order."
                  : `No one matches "${query}". Try a different name or email.`}
              </li>
            )}
          </ul>

          {customerError && (
            <p id="email-customer-error" role="alert" className="text-xs font-medium text-red-600">
              {customerError}
            </p>
          )}
        </div>
      )}
    </fieldset>
  );
}
