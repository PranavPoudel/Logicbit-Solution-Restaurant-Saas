// components/account/account-tabs.tsx
"use client";

import { useTranslations } from "next-intl";
import { Icon } from "@/components/ui/primitives";

interface Tab {
  key: string;
  label: string;
  icon?: string;
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
  const t = useTranslations("account");
  return (
    <div role="tablist" aria-label={t("sections")} className="no-scrollbar flex gap-2 overflow-x-auto py-1 md:sticky md:top-24 md:w-64 md:shrink-0 md:flex-col md:overflow-visible">
      {tabs.map(({ key, label, icon }) => (
        <button
          key={key}
          role="tab"
          aria-selected={activeKey === key}
          onClick={() => onSelect(key)}
          className={`flex min-h-12 shrink-0 items-center gap-3 rounded-full px-5 text-base font-bold md:text-lg ${
            activeKey === key ? "bg-ink text-cream shadow-soft" : "bg-paper text-ink/80 hover:bg-ink/10 hover:text-ink"
          }`}
        >
          {icon && <Icon name={icon} className="hidden h-5 w-5 md:block" />}
          {label}
        </button>
      ))}
    </div>
  );
}
