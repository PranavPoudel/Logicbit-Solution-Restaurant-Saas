// components/restaurant/opening-hours.tsx
"use client";

import { useLocale, useTranslations } from "next-intl";
import { OpenBadge } from "@/components/ui/primitives";
import { WEEK_ORDER, dayRanges, describeOpen, weekday } from "@/lib/utils/hours";
import type { RestaurantDetail } from "@/types/menu";

export function OpeningHours({ restaurant, divided }: { restaurant: RestaurantDetail; divided?: boolean }) {
  const t = useTranslations("restaurant");
  const locale = useLocale();
  const hours = restaurant.openingHours;
  const open = restaurant.isOpen !== false;
  const { detail } = describeOpen(restaurant.openStatus, open, t, locale);

  return (
    <div className={divided ? "mt-8 border-t border-ink/10 pt-6" : ""}>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <h3 className="font-display text-2xl font-extrabold">{t("hours.title")}</h3>
        <OpenBadge open={open} />
        {detail && <span className="font-medium text-ink/75">{detail}</span>}
      </div>
      {hours && hours.length > 0 && (
        <ul className="mt-4 grid gap-x-10 gap-y-1 md:grid-cols-2">
          {WEEK_ORDER.map((day) => {
            const ranges = dayRanges(hours.find((h) => h.day === day), locale);
            const today = restaurant.openStatus?.today === day;
            return (
              <li key={day} className={`flex items-baseline justify-between gap-4 rounded-xl px-3 py-2 ${today ? "bg-[var(--accent,var(--brand-chili))]/10 font-bold" : ""}`}>
                <span>
                  {weekday(day, locale)}
                  {today && <span className="ml-2 rounded-full bg-ink px-2 py-0.5 text-xs font-bold text-cream">{t("hours.today")}</span>}
                </span>
                <span className={`text-right ${ranges.length ? "" : "text-ink/60"}`}>{ranges.length ? ranges.join(", ") : t("hours.closedDay")}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
