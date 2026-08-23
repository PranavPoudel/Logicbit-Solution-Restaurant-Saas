// components/owner-settings/settings-tabs.tsx
"use client";

interface Tab {
  key: string;
  label: string;
}

export function SettingsTabs({
  tabs,
  activeKey,
  onSelect,
}: {
  tabs: Tab[];
  activeKey: string;
  onSelect: (key: string) => void;
}) {
  return (
    <div className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onSelect(tab.key)}
          className={`shrink-0 text-left text-sm font-medium px-3.5 py-2.5 rounded-lg transition-colors ${
            activeKey === tab.key
              ? "bg-[#1B2333] text-white"
              : "text-neutral-600 hover:bg-neutral-100"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
