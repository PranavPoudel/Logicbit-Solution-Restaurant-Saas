// components/account/account-tabs.tsx
"use client";

interface Tab {
  key: string;
  label: string;
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
    <div className="flex gap-1 overflow-x-auto border-b border-[#E8E7E2] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onSelect(tab.key)}
          className={`shrink-0 text-sm font-medium px-4 py-2.5 border-b-2 transition-colors ${
            activeKey === tab.key
              ? "border-[#E3A008] text-[#17181C]"
              : "border-transparent text-neutral-400 hover:text-[#17181C]"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
