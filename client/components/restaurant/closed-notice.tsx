"use client";

import { useLocale, useTranslations } from "next-intl";
import { Icon } from "@/components/ui/primitives";
import { describeOpen } from "@/lib/utils/hours";
import type { OpenStatus } from "@/types/hours";

interface ClosedNoticeProps {
  restaurant?: { name?: string; isOpen?: boolean; openStatus?: OpenStatus };
}

export function ClosedNotice({ restaurant }: ClosedNoticeProps) {
  const t = useTranslations("restaurant");
  const locale = useLocale();
  if (restaurant?.isOpen !== false) return null;
  const { detail } = describeOpen(restaurant.openStatus, false, t, locale);

  return (
    <div role="status" className="flex items-start gap-4 rounded-[28px] border-2 border-dashed border-chili/50 bg-chili/5 p-5">
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-chili/10 text-chili"><Icon name="clock" /></span>
      <div>
        <p className="font-display text-xl font-extrabold leading-tight">{t("closedNoticeTitle", { name: restaurant.name ?? "" })}</p>
        {detail && <p className="mt-1 font-bold text-chili">{detail}</p>}
        <p className="mt-1 text-ink/75">{t("closedNoticeBody")}</p>
      </div>
    </div>
  );
}
