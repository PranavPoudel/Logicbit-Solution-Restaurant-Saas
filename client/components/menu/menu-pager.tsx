// components/menu/menu-pager.tsx
"use client";

import { useTranslations } from "next-intl";
import { Icon } from "@/components/ui/primitives";

const NAV = "grid h-11 w-11 shrink-0 place-items-center rounded-full border-2 border-ink/15 transition hover:border-ink disabled:opacity-40 disabled:hover:border-ink/15";

const pagesAround = (page: number, count: number) => {
  const nums = [...new Set([1, count, page - 1, page, page + 1])].filter((n) => n >= 1 && n <= count).sort((a, b) => a - b);
  return nums.flatMap((n, i) => (i > 0 && n - nums[i - 1] > 1 ? [-n, n] : [n]));
};

export function MenuPager({ page, pageSize, total, category, onChange }: { page: number; pageSize: number; total: number; category: string; onChange: (page: number) => void }) {
  const t = useTranslations("menu");
  const pageCount = Math.ceil(total / pageSize);
  if (pageCount <= 1) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <nav aria-label={t("pagesOf", { category })} className="mt-8 flex flex-wrap items-center justify-between gap-4">
      <p className="text-ink/75">{t("showingRange", { from, to, total })}</p>
      <div className="flex items-center gap-2">
        <button type="button" className={NAV} disabled={page === 1} onClick={() => onChange(page - 1)} aria-label={t("prevPage")}>
          <Icon name="back" className="h-5 w-5" />
        </button>
        {pagesAround(page, pageCount).map((n) =>
          n < 0 ? (
            <span key={n} aria-hidden className="px-1 text-ink/50">…</span>
          ) : (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              aria-label={t("goToPage", { n })}
              aria-current={n === page ? "page" : undefined}
              className={`h-11 min-w-11 shrink-0 rounded-full px-3 font-bold transition ${n === page ? "bg-[var(--accent,var(--brand-chili))] text-[var(--accent-ink,var(--brand-parchment))]" : "border-2 border-ink/15 hover:border-ink"}`}
            >
              {n}
            </button>
          ),
        )}
        <button type="button" className={NAV} disabled={page === pageCount} onClick={() => onChange(page + 1)} aria-label={t("nextPage")}>
          <Icon name="back" className="h-5 w-5 rotate-180" />
        </button>
      </div>
    </nav>
  );
}
