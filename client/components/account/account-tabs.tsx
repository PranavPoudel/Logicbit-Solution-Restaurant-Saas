// components/account/account-tabs.tsx
"use client";

import type { ComponentType } from "react";

interface Tab {
  key: string;
  label: string;
  Icon?: ComponentType<{ size?: number; className?: string }>;
}

export function AccountTabs({
  tabs,
  activeKey,
  onSelect,
}: {
  tabs: Tab[];
  activeKey: string;
  onSelect: (key: string) => void;
}) {
  return (
    <div className="flex gap-1 overflow-x-auto border-b border-[#E8E7E2] md:sticky md:top-24 md:w-60 md:shrink-0 md:flex-col md:gap-0 md:overflow-visible md:border-b-0 md:border-l [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      {tabs.map(({ key, label, Icon }) => (
        <button
          key={key}
          onClick={() => onSelect(key)}
          className={`flex shrink-0 items-center gap-3 text-sm md:text-base font-medium px-4 min-h-11 md:min-h-12 md:text-left border-b-2 md:border-b-0 md:border-l-2 md:-ml-px transition-colors ${
            activeKey === key
              ? "border-[#E3A008] text-[#17181C]"
              : "border-transparent text-neutral-400 hover:text-[#17181C]"
          }`}
        >
          {Icon && <Icon size={18} className="hidden md:block" />}
          {label}
        </button>
      ))}
    </div>
  );
}
