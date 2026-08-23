// components/owner-orders/order-tabs.tsx
"use client";

interface Tab {
  key: string;
  label: string;
  count: number;
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
    <div className="flex gap-1 border-b border-neutral-200 mb-5 overflow-x-auto">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onSelect(tab.key)}
          className={`shrink-0 flex items-center gap-1.5 text-sm font-medium px-4 py-2.5 border-b-2 transition-colors ${
            activeKey === tab.key
              ? "border-[#E3A008] text-neutral-900"
              : "border-transparent text-neutral-400 hover:text-neutral-700"
          }`}
        >
          {tab.label}
          {tab.count > 0 && (
            <span
              className={`text-[11px] font-semibold rounded-full px-1.5 py-0.5 min-w-[18px] text-center ${
                activeKey === tab.key
                  ? "bg-[#E3A008] text-[#1B2333]"
                  : "bg-neutral-100 text-neutral-500"
              }`}
            >
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
