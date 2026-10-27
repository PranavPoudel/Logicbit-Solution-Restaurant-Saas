// components/menu/menu-section.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useCartStore } from "@/store/cart-store";
import { useIsMounted } from "@/hooks/use-is-mounted";
import { useRequireLogin } from "@/hooks/use-require-login";
import { useMoney } from "@/hooks/use-money";
import type { MenuCategory, MenuItem } from "@/types/menu";
import { Badge, Chip, Icon, IconButton, Squiggle } from "@/components/ui/primitives";
import { DishImage, DishListRow, DishTable, ViewToggle, type MenuView } from "@/components/menu/menu-views";
import { DishTags } from "@/components/menu/dish-tags";
import { PopularCategories, SignatureDishes } from "@/components/menu/signature-dishes";
import { getFullImageUrl } from "@/lib/utils/image";

const PAGE_SIZE = 12;
const catId = (id: string) => `cat-${id}`;

function DishCard({ item, onOpen }: { item: MenuItem; onOpen: () => void }) {
  const money = useMoney();
  const t = useTranslations("menu");
  const tc = useTranslations("common");
  const name = item.name ?? t("fallbackItem");
  const price = item.price ?? 0;
  const out = item.isAvailable === false;

  return (
    <article className={`group relative flex h-full flex-col overflow-hidden rounded-[28px] bg-paper shadow-soft transition ${out ? "" : "hover:-translate-y-1 hover:shadow-warm"}`}>
      <button type="button" onClick={onOpen} disabled={out} className="relative block aspect-[4/3] overflow-hidden disabled:cursor-not-allowed" aria-label={`${name}, ${money(price)}${out ? `, ${t("soldOutSuffix")}` : ""}`}>
        <DishImage item={item} className={`h-full w-full object-cover transition duration-500 ${out ? "opacity-60 grayscale" : "group-hover:scale-105"}`} />
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          {item.isFeatured && !out && <Badge tone="saffron"><Icon name="star" fill className="h-4 w-4" />{tc("popular")}</Badge>}
          {out && <Badge tone="ink">{tc("soldOut")}</Badge>}
        </div>
      </button>
      <div className={`flex flex-1 flex-col p-5 ${out ? "opacity-60" : ""}`}>
        <h3 className="font-display text-2xl font-bold leading-tight">{name}</h3>
        <p className="mt-1 line-clamp-2 min-h-[3.25rem] text-ink/75">{item.description}</p>
        <DishTags item={item} />
        <div className="mt-auto flex items-center justify-between border-t border-ink/10 pt-4">
          <span className="text-xl font-extrabold">{item.hasModifiers ? t("priceFrom", { price: money(price) }) : money(price)}</span>
          {out ? (
            <span className="font-medium text-ink/70">{t("unavailable")}</span>
          ) : (
            <button type="button" onClick={onOpen} aria-label={t("add", { name })} className="shadow-red grid h-12 w-12 place-items-center rounded-full bg-[var(--accent,var(--brand-chili))] text-[var(--accent-ink,var(--brand-parchment))] transition hover:scale-105">
              <Icon name="plus" className="h-6 w-6" />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

function CartPanel({ suggestions, onPick }: { suggestions: MenuItem[]; onPick: (id: string) => void }) {
  const money = useMoney();
  const t = useTranslations("menu");
  const tc = useTranslations("common");
  const mounted = useIsMounted();
  const items = useCartStore((s) => s.items);
  const itemCount = useCartStore((s) => s.itemCount());
  const subtotal = useCartStore((s) => s.subtotal());
  const discount = useCartStore((s) => s.discount());
  const addItem = useCartStore((s) => s.addItem);
  const removeOneOrAll = useCartStore((s) => s.removeOneOrAll);

  const lines = mounted ? items : [];
  const count = mounted ? itemCount : 0;
  const inCart = new Set(lines.map((l) => l.menuItemId));
  const picks = suggestions.filter((s) => !inCart.has(s.id)).slice(0, 4);

  return (
    <aside className="no-scrollbar sticky top-6 -m-2 hidden max-h-[calc(100dvh-3rem)] space-y-4 overflow-y-auto p-2 lg:block" aria-label={t("yourCart")}>
      <div className="rounded-[28px] bg-paper p-6 shadow-soft">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-2xl font-extrabold">{t("yourCart")}</h2>
          <span className="text-ink/70">{t("itemCount", { count })}</span>
        </div>
        {lines.length === 0 ? (
          <p className="mt-4 rounded-2xl bg-ink/5 p-4 text-ink/75">{t("emptyCart")}</p>
        ) : (
          <ul className="mt-4 max-h-[300px] divide-y divide-ink/10 overflow-y-auto">
            {lines.map((c) => (
              <li key={`${c.menuItemId}::${c.variantKey}`} className="flex items-center gap-3 py-3">
                {c.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={getFullImageUrl(c.image)} alt="" className="h-12 w-12 shrink-0 rounded-xl object-cover" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold">{c.name}</p>
                  <p className="text-ink/70">{money(c.price * c.quantity)}</p>
                </div>
                <div className="flex items-center rounded-full bg-ink/5">
                  <IconButton
                    icon={c.quantity === 1 ? "trash" : "minus"}
                    title={c.quantity === 1 ? tc("remove") : undefined}
                    label={c.quantity === 1 ? t("removeName", { name: c.name }) : t("oneLess", { name: c.name })}
                    onClick={() => removeOneOrAll(c.menuItemId, c.variantKey)}
                    className={c.quantity === 1 ? "text-chili" : ""}
                  />
                  <span className="w-5 text-center font-bold">{c.quantity}</span>
                  <IconButton icon="plus" label={t("oneMore", { name: c.name })} onClick={() => addItem({ ...c, quantity: 1 })} />
                </div>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-2 border-t-2 border-dashed border-ink/15 pt-4">
          {discount > 0 && (
            <div className="flex justify-between text-ink/70"><span>{t("discount")}</span><span>-{money(discount)}</span></div>
          )}
          <div className="flex items-baseline justify-between">
            <span className="font-bold">{t("subtotal")}</span>
            <span className="font-display text-[28px] font-extrabold leading-none">{money(Math.max(0, subtotal - discount))}</span>
          </div>
        </div>
        {count > 0 && (
          <div className="mt-4 space-y-2">
            <Link href="/checkout" className="shadow-red flex h-14 w-full items-center gap-2 rounded-full bg-[var(--accent,var(--brand-chili))] px-6 text-lg font-bold text-[var(--accent-ink,var(--brand-parchment))] transition hover:-translate-y-0.5">
              {t("checkout")}
              <Icon name="arrow" className="ml-auto h-5 w-5" />
            </Link>
            <Link href="/cart" className="flex min-h-11 w-full items-center justify-center font-bold underline underline-offset-4">{t("viewFullCart")}</Link>
          </div>
        )}
      </div>

      {picks.length > 0 && (
        <div className="rounded-[28px] bg-paper p-6 shadow-soft">
          <h3 className="font-display text-xl font-extrabold">{t("alsoOrdered")}</h3>
          <ul className="no-scrollbar -mx-6 mt-4 flex snap-x scroll-px-6 gap-4 overflow-x-auto px-6 pb-1">
            {picks.map((d) => (
              <li key={d.id} className="w-36 shrink-0 snap-start">
                <button type="button" onClick={() => onPick(d.id)} className="group w-full text-left">
                  <span className="relative block">
                    <DishImage item={d} className="aspect-square w-full rounded-2xl object-cover" />
                    <span className="shadow-soft absolute bottom-2 right-2 grid h-11 w-11 place-items-center rounded-full bg-[var(--accent,var(--brand-chili))] text-[var(--accent-ink,var(--brand-parchment))] transition group-hover:scale-105"><Icon name="plus" /></span>
                  </span>
                  <span className="mt-2 block font-bold leading-tight">{d.name}</span>
                  <span className="text-ink/70">{money(d.price ?? 0)}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  );
}

export function MenuSection({ categories, onOpenModifiers }: { categories: MenuCategory[]; onOpenModifiers: (itemId: string) => void }) {
  const money = useMoney();
  const t = useTranslations("menu");
  const requireLogin = useRequireLogin();
  const mounted = useIsMounted();
  const count = useCartStore((s) => s.itemCount());
  const subtotal = useCartStore((s) => s.subtotal());
  const discount = useCartStore((s) => s.discount());
  const [active, setActive] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [shown, setShown] = useState<Record<string, number>>({});
  const [view, setView] = useState<MenuView>("cards");

  const open = (id: string) => requireLogin() && onOpenModifiers(id);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return categories
      .map((c) => ({ ...c, items: (c.items ?? []).filter((i) => !needle || `${i.name ?? ""} ${i.description ?? ""}`.toLowerCase().includes(needle)) }))
      .filter((c) => c.items.length > 0);
  }, [categories, q]);

  const suggestions = useMemo(
    () => categories.flatMap((c) => c.items ?? []).filter((i) => i.isAvailable !== false).slice(0, 12),
    [categories],
  );

  const signature = useMemo(
    () => categories.flatMap((c) => c.items ?? []).filter((i) => i.isFeatured && i.isAvailable !== false).slice(0, 3),
    [categories],
  );

  const activeId = active ?? filtered[0]?.id ?? null;

  useEffect(() => {
    const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && setActive(e.target.id.replace("cat-", ""))), { rootMargin: "-120px 0px -60% 0px" });
    filtered.forEach((c) => {
      const el = document.getElementById(catId(c.id));
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, [filtered]);

  useEffect(() => {
    if (activeId) document.getElementById(`tab-${activeId}`)?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [activeId]);

  const jump = (id: string) => {
    const el = document.getElementById(catId(id));
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 100, behavior: "smooth" });
  };

  if (categories.length === 0) return null;

  return (
    <>
      <div className="mx-auto grid w-full max-w-[1440px] items-start gap-8 px-5 pt-8 md:px-10 lg:grid-cols-[1fr_360px]">
        <div className="min-w-0 space-y-12">
          {!q && <SignatureDishes items={signature} onOpen={open} />}
          {!q && <PopularCategories categories={categories} onJump={jump} />}
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-ink/10 pt-8">
            <h2 id="menu" className="scroll-mt-28 font-display text-[32px] font-extrabold leading-none tracking-tight md:text-[40px]">{t("fullMenu")}</h2>
            <ViewToggle view={view} onChange={setView} />
          </div>
          <div className="sticky top-0 z-30 mb-6 -mt-10 flex items-center gap-3 border-b border-ink/10 bg-cream/95 pb-3 pt-0 backdrop-blur">
            <div className="no-scrollbar flex flex-1 gap-2 overflow-x-auto py-1" role="tablist" aria-label={t("categories")}>
              {filtered.map((c) => (
                <Chip key={c.id} id={`tab-${c.id}`} role="tab" aria-selected={activeId === c.id} active={activeId === c.id} onClick={() => jump(c.id)}>
                  {c.name ?? t("fallbackName")}
                </Chip>
              ))}
            </div>
            <label className={`group shadow-soft relative flex h-11 shrink-0 cursor-text items-center overflow-hidden rounded-full bg-paper transition-[width] duration-300 ease-out focus-within:w-56 focus-within:ring-2 focus-within:ring-ink motion-reduce:transition-none md:focus-within:w-72 ${q ? "w-56 md:w-72" : "w-11"}`}>
              <span className="grid h-11 w-11 shrink-0 place-items-center"><Icon name="search" className="h-5 w-5 text-ink/70" /></span>
              <input value={q} onChange={(e) => setQ(e.target.value)} aria-label={t("searchMenu")} placeholder={t("searchMenu")} className={`min-w-0 flex-1 bg-transparent pr-3 outline-none transition-opacity duration-200 placeholder:text-ink/55 group-focus-within:opacity-100 group-focus-within:delay-100 ${q ? "opacity-100" : "opacity-0"}`} />
              {q && (
                <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => setQ("")} aria-label={t("clearSearch")} className="grid h-11 w-11 shrink-0 place-items-center"><Icon name="x" className="h-5 w-5" /></button>
              )}
            </label>
          </div>
          {filtered.length === 0 && (
            <p className="rounded-[28px] bg-paper p-8 text-center text-lg shadow-soft">
              {t("noMatch", { q })}{" "}
              <button type="button" onClick={() => setQ("")} className="font-bold text-[var(--accent,var(--brand-chili))] underline">{t("clearSearch")}</button>
            </p>
          )}
          {filtered.map((c) => {
            const visible = shown[c.id] ?? PAGE_SIZE;
            const remaining = c.items.length - visible;
            return (
              <section key={c.id} id={catId(c.id)} aria-labelledby={`h-${c.id}`}>
                <h2 id={`h-${c.id}`} className="relative mb-6 inline-block font-display text-[40px] font-extrabold leading-tight tracking-tight">
                  {c.name ?? t("fallbackName")}
                  <Squiggle className="absolute -bottom-1 left-0 h-3 w-full text-[var(--accent,var(--brand-chili))]" />
                </h2>
                {view === "table" ? (
                  <DishTable items={c.items.slice(0, visible)} onOpen={open} />
                ) : (
                  <div className={view === "list" ? "grid gap-4 xl:grid-cols-2" : "grid gap-6 sm:grid-cols-2 xl:grid-cols-3"}>
                    {c.items.slice(0, visible).map((d) =>
                      view === "list" ? <DishListRow key={d.id} item={d} onOpen={() => open(d.id)} /> : <DishCard key={d.id} item={d} onOpen={() => open(d.id)} />,
                    )}
                  </div>
                )}
                {remaining > 0 && (
                  <button
                    type="button"
                    onClick={() => setShown((s) => ({ ...s, [c.id]: visible + PAGE_SIZE }))}
                    className="mt-6 min-h-12 w-full rounded-full border-2 border-ink font-bold transition hover:bg-ink hover:text-cream"
                  >
                    {t("showMore", { count: remaining, category: c.name ?? t("thisCategory") })}
                  </button>
                )}
              </section>
            );
          })}
        </div>
        <CartPanel suggestions={suggestions} onPick={open} />
      </div>

      {mounted && count > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 bg-gradient-to-t from-cream via-cream/90 to-transparent p-4 pt-6 lg:hidden">
          <Link href="/cart" className="shadow-red flex h-14 w-full items-center gap-3 rounded-full bg-[var(--accent,var(--brand-chili))] pl-2 pr-6 text-[var(--accent-ink,var(--brand-parchment))]">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-parchment font-bold text-espresso">{count}</span>
            <span className="flex-1 text-left text-lg font-bold">{t("viewCart")}</span>
            <span className="text-lg font-bold">{money(Math.max(0, subtotal - discount))}</span>
            <Icon name="arrow" className="h-5 w-5" />
          </Link>
        </div>
      )}
    </>
  );
}
