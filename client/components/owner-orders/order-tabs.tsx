// components/owner-orders/order-tabs.tsx
"use client";

import type { LucideIcon } from "lucide-react";

interface Tab {
  key: string;
  label: string;
  count: number;
  isSystem?: boolean;
  icon?: LucideIcon;
}

export function OrderTabs({
  tabs,
  activeKey,
  onSelect,
}: {
  tabs: Tab[];
  activeKey: string;
  onSelect: (key: string) => void;
}) {
  return (
    <div className="flex gap-1 border-b border-neutral-200 mb-6 overflow-x-auto">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <button
            key={tab.key}
            onClick={() => onSelect(tab.key)}
            className={`shrink-0 flex items-center gap-2 text-sm font-medium px-4 py-2.5 border-b-2 transition-all ${
              activeKey === tab.key
                ? "border-[#E3A008] text-neutral-900"
                : "border-transparent text-neutral-500 hover:text-neutral-700"
            }`}
          >
            {Icon && <Icon size={16} className={tab.key === "TRASH" ? "text-neutral-400" : ""} />}
            {tab.label}
            {tab.count > 0 && (
              <span
                className={`text-[11px] font-semibold rounded-full px-2 py-0.5 min-w-[20px] text-center ${
                  activeKey === tab.key
                    ? "bg-[#E3A008] text-[#1B2333]"
                    : tab.isSystem
                    ? "bg-red-100 text-red-700"
                    : "bg-neutral-100 text-neutral-600"
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}