// components/ui/pager.tsx
"use client";

import { useTranslations } from "next-intl";
import { Button, Icon } from "@/components/ui/primitives";

interface PagerProps {
  page: number;
  pageCount: number;
  onChange: (page: number) => void;
}

export function Pager({ page, pageCount, onChange }: PagerProps) {
  const t = useTranslations("common");
  if (pageCount <= 1) return null;

  return (
    <nav aria-label={t("pagination")} className="flex items-center justify-between pt-2">
      <Button variant="outline" disabled={page === 1} onClick={() => onChange(page - 1)}>
        <Icon name="back" className="h-4 w-4" />{t("previous")}
      </Button>
      <span className="font-bold text-ink/75">
        {t("page", { page, total: pageCount })}
      </span>
      <Button variant="outline" disabled={page === pageCount} onClick={() => onChange(page + 1)}>
        {t("next")}<Icon name="arrow" className="h-4 w-4" />
      </Button>
    </nav>
  );
}
