// components/menu/dish-tags.tsx
"use client";

import { useTranslations } from "next-intl";
import type { MenuItem } from "@/types/menu";
import { AllergenAlert, Badge, Icon } from "@/components/ui/primitives";

export const SPICE_LEVELS = {
  NONE: { key: "spiceNone", level: 0 },
  MILD: { key: "spiceMild", level: 1 },
  MEDIUM: { key: "spiceMedium", level: 2 },
  HOT: { key: "spiceHot", level: 3 },
  VERY_HOT: { key: "spiceVeryHot", level: 4 },
} as const;

export const spiceOf = (item: Pick<MenuItem, "spiceLevel">) => SPICE_LEVELS[(item.spiceLevel ?? "NONE") as keyof typeof SPICE_LEVELS] ?? SPICE_LEVELS.NONE;

export function SpiceBadge({ item }: { item: Pick<MenuItem, "spiceLevel"> }) {
  const t = useTranslations("dish");
  const spice = spiceOf(item);
  if (spice.level === 0) return null;
  return (
    <Badge tone="chili">
      <span className="inline-flex" aria-hidden>{Array.from({ length: spice.level }, (_, i) => <Icon key={i} name="flame" className="-mr-1 h-4 w-4" />)}</span>
      {t(spice.key)}
    </Badge>
  );
}

export function DishTags({ item }: { item: MenuItem }) {
  const t = useTranslations("dish");
  const tm = useTranslations("menu");
  const veg = item.isVegan || item.isVegetarian;
  return (
    <div className="mt-3 pb-4">
      <div className="flex flex-wrap gap-2">
        {veg ? (
          <Badge tone="herb"><Icon name="leaf" className="h-4 w-4" />{item.isVegan ? t("vegan") : t("vegetarian")}</Badge>
        ) : (
          <Badge tone="soft"><span className="h-2 w-2 rounded-full bg-chili" aria-hidden />{tm("nonVeg")}</Badge>
        )}
        <SpiceBadge item={item} />
        {item.hasModifiers && <Badge tone="soft"><Icon name="plus" className="h-4 w-4" />{tm("customisable")}</Badge>}
      </div>
      {item.allergenInfo && <AllergenAlert text={item.allergenInfo} compact />}
    </div>
  );
}
