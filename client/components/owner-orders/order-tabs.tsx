// components/owner-orders/order-tabs.tsx
"use client";

import { useRef } from "react";

interface Tab {
  key: string;
  label: string;
  count: number;
  highlight?: boolean;
  history?: boolean;
}

export const ORDERS_PANEL_ID = "orders-panel";

export function OrderTabs({ tabs, activeKey, onSelect }: { tabs: Tab[]; activeKey: string; onSelect: (key: string) => void }) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const go = (index: number) => {
    const next = (index + tabs.length) % tabs.length;
    onSelect(tabs[next].key);
    refs.current[next]?.focus();
  };

  return (
    <div role="tablist" aria-label="Order lists" className="flex gap-1 overflow-x-auto border-b border-neutral-200 [scrollbar-width:thin]">
      {tabs.map((tab, i) => {
        const active = tab.key === activeKey;
        return (
          <div key={tab.key} className="flex shrink-0 items-center">
            {tab.history && !tabs[i - 1]?.history && <span aria-hidden="true" className="mx-2 h-5 w-px bg-neutral-200" />}
            <button
              ref={(el) => {
                refs.current[i] = el;
              }}
              type="button"
              role="tab"
              id={`orders-tab-${tab.key}`}
              aria-selected={active}
              aria-controls={ORDERS_PANEL_ID}
              tabIndex={active ? 0 : -1}
              onClick={() => onSelect(tab.key)}
              onKeyDown={(e) => {
                if (e.key === "ArrowRight") go(i + 1);
                else if (e.key === "ArrowLeft") go(i - 1);
                else if (e.key === "Home") go(0);
                else if (e.key === "End") go(tabs.length - 1);
                else return;
                e.preventDefault();
              }}
              className={`flex min-h-11 items-center gap-2 border-b-2 px-4 text-sm font-medium transition-colors motion-reduce:transition-none outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#E3A008] ${
                active ? "border-[#E3A008] text-neutral-900" : "border-transparent text-neutral-500 hover:text-neutral-800"
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <>
                  <span
                    aria-hidden="true"
                    className={`min-w-5 rounded-full px-1.5 py-0.5 text-center text-[11px] font-semibold ${
                      tab.highlight ? "bg-[#E3A008] text-[#111827]" : "bg-neutral-100 text-neutral-600"
                    }`}
                  >
                    {tab.count}
                  </span>
                  <span className="sr-only">
                    , {tab.count} {tab.count === 1 ? "order" : "orders"}
                  </span>
                </>
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
}
