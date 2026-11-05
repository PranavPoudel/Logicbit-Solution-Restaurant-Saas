// components/menu/menu-views.tsx
"use client";

import { useTranslations } from "next-intl";
import { getFullImageUrl, getItemImage } from "@/lib/utils/image";
import { useMoney } from "@/hooks/use-money";
import type { MenuItem } from "@/types/menu";
import { AllergenAlert, Icon } from "@/components/ui/primitives";
import { spiceOf } from "@/components/menu/dish-tags";

export type MenuView = "cards" | "list" | "table";

export function DishImage({ item, className }: { item: MenuItem; className: string }) {
  const src = getItemImage(item);
  if (!src) {
    return <div className={`grid place-items-center bg-tangerine/50 font-display text-6xl font-extrabold text-espresso/25 ${className}`}>{(item.name ?? "").charAt(0)}</div>;
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={getFullImageUrl(src)} alt="" className={className} />;
}

function SpiceDots({ item }: { item: MenuItem }) {
  const t = useTranslations("menu");
  const { level } = spiceOf(item);
  return (
    <span className="inline-flex items-center gap-1" role="img" aria-label={t("spiceLevel", { level })}>
      {[1, 2, 3, 4].map((i) => <span key={i} className={`h-2.5 w-2.5 rounded-full ${i <= level ? "bg-chili" : "bg-ink/15"}`} />)}
    </span>
  );
}

function VegDot({ item }: { item: MenuItem }) {
  const t = useTranslations("menu");
  const veg = !!(item.isVegetarian || item.isVegan);
  return (
    <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-[4px] border-2 ${veg ? "border-herb" : "border-chili"}`} role="img" aria-label={veg ? t("veg") : t("nonVeg")}>
      <span className={`h-2 w-2 rounded-full ${veg ? "bg-herb" : "bg-chili"}`} />
    </span>
  );
}

function AddButton({ item, onOpen }: { item: MenuItem; onOpen: () => void }) {
  const t = useTranslations("menu");
  const out = item.isAvailable === false;
  return (
    <button type="button" onClick={onOpen} disabled={out} aria-label={t("add", { name: item.name ?? t("fallbackItem") })} className="shadow-red grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[var(--accent,var(--brand-chili))] text-[var(--accent-ink,var(--brand-parchment))] transition hover:scale-105 active:scale-95 disabled:bg-ink/15 disabled:text-ink/50 disabled:shadow-none">
      <Icon name="plus" className="h-5 w-5" />
    </button>
  );
}

const VIEWS: { id: MenuView; label: string; icon: string }[] = [
  { id: "cards", label: "viewCards", icon: "grid" },
  { id: "list", label: "viewList", icon: "rows" },
  { id: "table", label: "viewTable", icon: "menu" },
];

export function ViewToggle({ view, onChange }: { view: MenuView; onChange: (v: MenuView) => void }) {
  const t = useTranslations("menu");
  return (
    <div role="radiogroup" aria-label={t("viewLayout")} className="shadow-soft inline-flex rounded-full bg-paper p-1">
      {VIEWS.map((v) => (
        <button key={v.id} type="button" role="radio" aria-checked={view === v.id} aria-label={t(v.label)} title={t(v.label)} onClick={() => onChange(v.id)} className={`grid h-11 w-12 place-items-center rounded-full transition active:scale-95 ${view === v.id ? "bg-[var(--accent,var(--brand-chili))] text-[var(--accent-ink,var(--brand-parchment))]" : "text-ink/75 hover:text-ink"}`}>
          <Icon name={v.icon} />
        </button>
      ))}
    </div>
  );
}

export function DishListRow({ item, onOpen }: { item: MenuItem; onOpen: () => void }) {
  const money = useMoney();
  const t = useTranslations("menu");
  const tc = useTranslations("common");
  const out = item.isAvailable === false;
  return (
    <article className={`shadow-soft flex items-center gap-4 rounded-[28px] bg-paper p-3 pr-4 ${out ? "opacity-70" : ""}`}>
      <div className="relative shrink-0">
        <DishImage item={item} className={`blob h-24 w-24 object-cover md:h-28 md:w-28 ${out ? "grayscale" : ""}`} />
        {out && <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 -rotate-6 whitespace-nowrap rounded-lg bg-ink px-2 font-bold text-cream">{tc("soldOut")}</span>}
        {item.isFeatured && !out && <span className="absolute -left-1 -top-1 -rotate-12 rounded-lg bg-saffron px-2 font-bold text-espresso">★</span>}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2"><VegDot item={item} /><h3 className="truncate font-display text-xl font-extrabold">{item.name ?? t("fallbackItem")}</h3></div>
        {item.description && <p className="mt-1 line-clamp-2 text-ink/80">{item.description}</p>}
        <div className="mt-2 flex items-center gap-3"><b className="text-lg">{item.hasModifiers ? t("priceFrom", { price: money(item.price ?? 0) }) : money(item.price ?? 0)}</b><SpiceDots item={item} />{item.hasModifiers && <span className="font-medium text-ink/75">{t("customisable")}</span>}</div>
        {item.allergenInfo && <AllergenAlert text={item.allergenInfo} compact />}
      </div>
      <AddButton item={item} onOpen={onOpen} />
    </article>
  );
}

export function DishTable({ items, onOpen }: { items: MenuItem[]; onOpen: (id: string) => void }) {
  const money = useMoney();
  const t = useTranslations("menu");
  const tc = useTranslations("common");
  return (
    <div className="shadow-soft overflow-hidden rounded-[28px] bg-paper">
      <table className="w-full text-left">
        <thead className="hidden border-b-2 border-ink/10 md:table-header-group">
          <tr className="text-ink/75"><th className="px-5 py-3 font-bold">{t("colDish")}</th><th className="py-3 font-bold">{t("colSpice")}</th><th className="py-3 font-bold">{t("colPrice")}</th><th className="w-16 py-3"><span className="sr-only">{t("colAdd")}</span></th></tr>
        </thead>
        <tbody className="divide-y divide-ink/10">
          {items.map((d) => {
            const out = d.isAvailable === false;
            const price = d.hasModifiers ? t("priceFrom", { price: money(d.price ?? 0) }) : money(d.price ?? 0);
            return (
              <tr key={d.id} className={`transition hover:bg-ink/5 ${out ? "opacity-60" : ""}`}>
                <td className="px-4 py-3 md:px-5">
                  <div className="flex items-start gap-3">
                    <span className="mt-1"><VegDot item={d} /></span>
                    <div className="min-w-0">
                      <p className="font-bold">{d.name ?? t("fallbackItem")}{out && <span className="ml-2 rounded-md bg-ink px-1.5 font-bold text-cream">{tc("soldOut")}</span>}</p>
                      {d.description && <p className="line-clamp-1 text-ink/75">{d.description}</p>}
                      {(d.hasModifiers || d.allergenInfo) && <p className="mt-1 text-ink/75">{[d.hasModifiers && t("customisable"), d.allergenInfo && tc("containsCompact", { text: d.allergenInfo })].filter(Boolean).join(" · ")}</p>}
                      <p className="mt-1 flex items-center gap-3 md:hidden"><b>{price}</b><SpiceDots item={d} /></p>
                    </div>
                  </div>
                </td>
                <td className="hidden py-3 md:table-cell"><SpiceDots item={d} /></td>
                <td className="hidden py-3 font-bold md:table-cell">{price}</td>
                <td className="py-2 pr-3 text-right md:pr-5"><AddButton item={d} onOpen={() => onOpen(d.id)} /></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
