// components/menu/signature-dishes.tsx
"use client";

import { useTranslations } from "next-intl";
import { getFullImageUrl, getItemImage } from "@/lib/utils/image";
import { useMoney } from "@/hooks/use-money";
import type { MenuCategory, MenuItem } from "@/types/menu";
import { Icon } from "@/components/ui/primitives";
import { DishTags } from "@/components/menu/dish-tags";

export function SignatureDishes({ items, onOpen }: { items: MenuItem[]; onOpen: (id: string) => void }) {
  const money = useMoney();
  const t = useTranslations("menu");
  if (items.length === 0) return null;
  return (
    <section aria-labelledby="sig">
      <h2 id="sig" className="font-display text-[32px] font-extrabold tracking-tight md:text-[40px]">{t("signatureTitle")}</h2>
      <div className="no-scrollbar -mx-5 mt-6 flex snap-x gap-6 overflow-x-auto px-5 pb-4 pt-4 md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0">
        {items.map((d, i) => {
          const src = getItemImage(d);
          const name = d.name ?? t("fallbackItem");
          return (
            <article key={d.id} className="shadow-soft relative flex w-[80%] shrink-0 snap-start flex-col rounded-[32px] bg-paper p-5 md:w-auto">
              <span className={`shadow-hard absolute -top-3 right-5 z-10 rounded-xl bg-saffron px-3 py-1 font-display text-base font-extrabold text-espresso ${i % 2 ? "rotate-6" : "-rotate-6"}`}>{t("chefsPick")}</span>
              {src && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={getFullImageUrl(src)} alt={name} className="blob shadow-warm mx-auto aspect-square w-[80%] border-[6px] border-cream object-cover" />
              )}
              <h3 className="mt-4 font-display text-[28px] font-extrabold leading-tight">{name}</h3>
              {d.description && <p className="mt-1 line-clamp-1 text-ink/80">{d.description}</p>}
              <DishTags item={d} />
              <button type="button" onClick={() => onOpen(d.id)} aria-label={t("add", { name })} className="shadow-red mt-4 flex h-12 items-center justify-center gap-2 self-start rounded-full bg-[var(--accent,var(--brand-chili))] px-6 font-bold text-[var(--accent-ink,var(--brand-parchment))] transition hover:-translate-y-0.5">
                <Icon name="plus" className="h-5 w-5" />{t("addPrice", { price: money(d.price ?? 0) })}
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}

const CATEGORY_ICONS: [RegExp, string][] = [
  [/momo|dumpling|soup|noodle|rice|dal|thali|bowl|curry/i, "bowl"],
  [/drink|beverage|tea|coffee|juice|shake|lassi|beer/i, "cup"],
  [/dessert|sweet|cake|ice|mithai|pastry/i, "cake"],
  [/burger|sandwich|wrap/i, "burger"],
  [/side|fries|snack|starter/i, "fries"],
  [/pizza|pasta/i, "pizza"],
];
const categoryIcon = (name = "") => CATEGORY_ICONS.find(([re]) => re.test(name))?.[1] ?? "utensils";
const TILES = ["bg-[var(--accent,var(--brand-chili))] text-[var(--accent-ink,var(--brand-parchment))]", "bg-saffron text-espresso", "bg-herb text-parchment", "bg-tangerine text-espresso"];

export function PopularCategories({ categories, onJump }: { categories: MenuCategory[]; onJump: (id: string) => void }) {
  const t = useTranslations("menu");
  const cats = categories.filter((c) => (c.items ?? []).length > 0);
  if (cats.length < 2) return null;
  return (
    <section aria-labelledby="pc">
      <h2 id="pc" className="font-display text-2xl font-extrabold">{t("popularCategories")}</h2>
      <ul className="no-scrollbar -mx-5 mt-4 flex gap-6 overflow-x-auto px-5 py-3 md:mx-0 md:px-1">
        {cats.map((c, i) => (
          <li key={c.id} className="shrink-0">
            <button type="button" onClick={() => onJump(c.id)} className="group flex w-36 flex-col items-center gap-3 rounded-3xl p-1 text-center active:scale-95">
              <span className="relative">
                <span className={`blob shadow-warm grid h-32 w-32 place-items-center overflow-hidden border-4 border-paper transition group-hover:-translate-y-1 group-hover:rotate-3 ${TILES[i % TILES.length]}`}>
                  {c.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={getFullImageUrl(c.image)} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <Icon name={categoryIcon(c.name)} className="h-14 w-14" />
                  )}
                </span>
                <span className="absolute -bottom-1 -right-1 grid h-9 min-w-9 place-items-center rounded-full bg-ink px-2 text-lg font-bold text-cream">{c.items?.length}</span>
              </span>
              <span className="font-display text-xl font-bold group-hover:text-[var(--accent,var(--brand-chili))]">{c.name}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
