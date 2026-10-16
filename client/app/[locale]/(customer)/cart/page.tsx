"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { CouponInput } from "@/components/cart/coupon-input";
import { AllergenAlert, Button, Card, Icon, IconButton, Progress, RefundNote, Squiggle, Stepper } from "@/components/ui/primitives";
import { useCartStore, type CartItem } from "@/store/cart-store";
import { useIsMounted } from "@/hooks/use-is-mounted";
import { getRestaurantByIdOrSlug } from "@/lib/api/discovery";
import { restaurantAccentStyle } from "@/lib/utils/restaurant-theme";
import { getFullImageUrl } from "@/lib/utils/image";
import { money } from "@/lib/utils/money";

function CheckoutButton({ total }: { total: number }) {
  const t = useTranslations("cart");
  return (
  <Link
    href="/checkout"
    className="shadow-red flex h-14 w-full items-center justify-between gap-3 rounded-full bg-[var(--accent,var(--brand-chili))] px-6 text-lg font-bold text-[var(--accent-ink,var(--brand-parchment))] transition hover:-translate-y-0.5"
  >
    <span>{t("checkout")} - {money(total)}</span>
    <Icon name="arrow" className="h-5 w-5" />
  </Link>
  );
}

function Trust({ methods }: { methods: string[] }) {
  const t = useTranslations("cart");
  return (
    <ul className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-ink/75">
      <li className="flex items-center gap-1.5"><Icon name="lock" className="h-4 w-4 text-herb" />{t("secure")}</li>
      {methods.map((m) => (
        <li key={m} className="flex items-center gap-1.5">{m}</li>
      ))}
    </ul>
  );
}

function Row({ l, v, c = "" }: { l: string; v: ReactNode; c?: string }) {
  return (
    <div className={`flex justify-between ${c}`}>
      <span>{l}</span>
      <span className="font-bold">{v}</span>
    </div>
  );
}

function Summary({ count, sub, discount, total, children, cta }: { count: number; sub: number; discount: number; total: number; children?: ReactNode; cta?: ReactNode }) {
  const t = useTranslations("cart");
  return (
    <Card className="space-y-4 !p-6">
      <h2 className="font-display text-2xl font-extrabold">{t("summary")}</h2>
      <CouponInput />
      <div className="space-y-2">
        <Row l={t("subtotalItems", { count })} v={money(sub)} />
        <Row l={t("deliveryFee")} v={<span className="text-sm font-medium italic text-ink/70">{t("workedOut")}</span>} />
        {discount > 0 && <Row l={t("discount")} v={`-${money(discount)}`} c="text-herb" />}
      </div>
      <div className="flex items-baseline justify-between border-t-2 border-dashed border-ink/15 pt-4">
        <span className="text-lg font-bold">{t("total")}</span>
        <span className="font-display text-[32px] font-extrabold leading-none">{money(total)}</span>
      </div>
      {children}
      {cta}
    </Card>
  );
}

function ItemRow({ i }: { i: CartItem }) {
  const tc = useTranslations("common");
  const addItem = useCartStore((s) => s.addItem);
  const removeOneOrAll = useCartStore((s) => s.removeOneOrAll);
  const removeItem = useCartStore((s) => s.removeItem);
  const mods = (i.selectedModifiers ?? []).map((m) => m.optionName).filter(Boolean) as string[];
  if (i.notes) mods.push(`"${i.notes}"`);

  return (
    <li className="grid grid-cols-[72px_1fr] gap-x-4 gap-y-3 py-4 sm:grid-cols-[72px_1fr_auto] sm:items-center">
      {i.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={getFullImageUrl(i.image)} alt="" className="h-[72px] w-[72px] rounded-2xl object-cover" />
      ) : (
        <span className="grid h-[72px] w-[72px] place-items-center rounded-2xl bg-saffron/30 font-display text-2xl font-extrabold text-ink/40">{i.name.charAt(0)}</span>
      )}
      <div className="min-w-0">
        <p className="text-lg font-bold leading-snug">{i.name}</p>
        {mods.length > 0 && <p className="text-ink/70">{mods.join(" · ")}</p>}
        {i.allergenInfo && <AllergenAlert compact text={i.allergenInfo} />}
        <button type="button" onClick={() => removeItem(i.menuItemId, i.variantKey)} className="mt-1 block min-h-11 font-medium text-ink/70 underline underline-offset-4 hover:text-chili sm:min-h-8">
          {tc("remove")}
        </button>
      </div>
      <div className="col-start-2 flex items-center justify-between gap-4 sm:col-start-auto">
        <Stepper
          value={i.quantity}
          onChange={(n) => (n <= 0 ? removeItem(i.menuItemId, i.variantKey) : n > i.quantity ? addItem({ ...i, quantity: 1 }) : removeOneOrAll(i.menuItemId, i.variantKey))}
        />
        <span className="w-24 text-right text-lg font-extrabold">{money(i.price * i.quantity)}</span>
      </div>
    </li>
  );
}

function EmptyCart() {
  const t = useTranslations("cart");
  return (
    <div className="mx-auto max-w-xl px-5 py-16 text-center">
      <svg viewBox="0 0 240 200" className="mx-auto w-56" aria-hidden>
        <ellipse cx="120" cy="170" rx="90" ry="12" fill="currentColor" opacity=".08" />
        <circle cx="120" cy="105" r="78" fill="var(--brand-saffron)" />
        <circle cx="120" cy="105" r="56" fill="var(--color-paper)" />
        <circle cx="102" cy="96" r="6" fill="currentColor" />
        <circle cx="138" cy="96" r="6" fill="currentColor" />
        <path d="M100 128c12-10 28-10 40 0" stroke="currentColor" strokeWidth="6" fill="none" strokeLinecap="round" />
        <path d="M30 40v50M22 40v22a8 8 0 0016 0V40" stroke="var(--brand-chili)" strokeWidth="6" fill="none" strokeLinecap="round" />
        <path d="M210 40c-10 10-10 30 0 40v30" stroke="var(--brand-herb)" strokeWidth="6" fill="none" strokeLinecap="round" />
      </svg>
      <h1 className="mt-6 font-display text-[40px] font-extrabold leading-tight">
        {t("emptyTitleA")}{" "}
        <span className="relative inline-block">
          {t("emptyTitleB")}
          <Squiggle className="absolute -bottom-1 left-0 h-3 w-full text-chili" />
        </span>
      </h1>
      <p className="mt-3 text-lg text-ink/75">{t("emptyBody")}</p>
      <Link href="/restaurants"><Button size="lg" className="mt-8">{t("browseRestaurants")}</Button></Link>
    </div>
  );
}

export default function CartPage() {
  const t = useTranslations("cart");
  const tc = useTranslations("common");
  const mounted = useIsMounted();
  const items = useCartStore((s) => s.items);
  const itemCount = useCartStore((s) => s.itemCount());
  const subtotal = useCartStore((s) => s.subtotal());
  const discount = useCartStore((s) => s.discount());
  const clear = useCartStore((s) => s.clear);
  const restaurantId = useCartStore((s) => s.activeRestaurantId());
  const [confirmEmpty, setConfirmEmpty] = useState(false);
  const [sheet, setSheet] = useState(false);

  const restaurantQuery = useQuery({
    queryKey: ["restaurant", restaurantId],
    queryFn: () => getRestaurantByIdOrSlug(restaurantId as string),
    enabled: !!restaurantId && mounted,
  });
  const r = restaurantQuery.data;
  const total = Math.max(0, subtotal - discount);
  const methods = [r?.supportsEsewa && "eSewa", r?.supportsKhalti && "Khalti", r?.supportsCod !== false && t("cod")].filter(Boolean) as string[];
  const initials = (r?.name ?? "").split(/\s+/).map((w) => w[0]).filter((c) => /[A-Za-z0-9&]/.test(c)).slice(0, 2).join("").toUpperCase();

  if (!mounted) {
    return <div className="mx-auto w-full max-w-[1440px] px-5 py-10 md:px-10" aria-busy="true"><div className="h-96 animate-pulse rounded-[28px] bg-ink/10" /></div>;
  }

  if (items.length === 0) return <EmptyCart />;

  const cta = (
    <div className="space-y-4">
      <CheckoutButton total={total} />
      <Trust methods={methods} />
    </div>
  );

  return (
    <div style={restaurantAccentStyle(r)} className="pb-32 lg:pb-16">
      <div className="mx-auto w-full max-w-[1440px] px-5 md:px-10">
        <div className="max-w-md"><Progress step={0} /></div>
        <div className="mb-8 mt-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-[40px] font-extrabold leading-tight tracking-tight">{t("title")}</h1>
            <p className="text-lg text-ink/70">{r?.name ? t("subtitleFrom", { count: itemCount, restaurant: r.name }) : t("subtitle", { count: itemCount })}</p>
          </div>
          <div className="relative">
            <Button variant="ghost" onClick={() => setConfirmEmpty(true)} aria-expanded={confirmEmpty}><Icon name="trash" />{t("emptyCartBtn")}</Button>
            {confirmEmpty && (
              <div role="alertdialog" aria-label={t("removeAllTitle")} className="absolute right-0 top-full z-20 mt-2 w-72 rounded-3xl bg-paper p-5 shadow-warm">
                <p className="font-display text-xl font-extrabold">{t("removeAllTitle")}</p>
                <p className="mt-1 text-ink/70">{t("removeAllBody", { count: itemCount })}</p>
                <div className="mt-4 flex gap-2">
                  <Button variant="accent" onClick={() => { clear(); setConfirmEmpty(false); }}>{t("removeAll")}</Button>
                  <Button variant="ghost" onClick={() => setConfirmEmpty(false)}>{tc("cancel")}</Button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid items-start gap-8 lg:grid-cols-[1fr_400px]">
          <div className="space-y-6">
            <Card className="!p-6">
              <div className="flex items-center gap-4 border-b-2 border-ink/10 pb-4">
                <span className="grid h-12 w-12 shrink-0 -rotate-6 place-items-center rounded-full bg-[var(--accent,var(--brand-chili))] font-display text-lg font-extrabold text-[var(--accent-ink,var(--brand-parchment))]">{initials || "·"}</span>
                <div className="min-w-0 flex-1">
                  <h2 className="font-display text-2xl font-extrabold leading-tight">{r?.name ?? "Your order"}</h2>
                  {r?.estimatedDeliveryMinutes != null && (
                    <p className="flex items-center gap-1 text-ink/70"><Icon name="clock" className="h-4 w-4" />{r.estimatedDeliveryMinutes} min</p>
                  )}
                </div>
                {r && (
                  <Link href={`/restaurants/${r.slug ?? r.id}`} className="hidden min-h-11 items-center gap-1 rounded-full px-5 font-bold hover:bg-ink/10 sm:inline-flex">
                    <Icon name="plus" />{t("addMore")}
                  </Link>
                )}
              </div>
              <ul className="divide-y-2 divide-dashed divide-ink/10">
                {items.map((i) => <ItemRow key={`${i.menuItemId}::${i.variantKey}`} i={i} />)}
              </ul>
              <div className="flex justify-between border-t-2 border-ink/10 pt-4 font-bold">
                <span>{t("subtotal")}</span>
                <span>{money(subtotal)}</span>
              </div>
            </Card>
          </div>

          <div className="hidden space-y-4 lg:sticky lg:top-6 lg:block">
            <Summary count={itemCount} sub={subtotal} discount={discount} total={total} cta={cta} />
            <RefundNote text={r?.refundPolicy} />
          </div>
          <div className="lg:hidden"><RefundNote text={r?.refundPolicy} /></div>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 rounded-t-[28px] bg-paper p-4 shadow-[0_-12px_30px_-12px_rgba(160,40,10,.35)] lg:hidden">
        <button type="button" onClick={() => setSheet(true)} className="mb-3 flex min-h-11 w-full items-center justify-between" aria-haspopup="dialog">
          <span className="text-ink/70">{t("totalDot")} <span className="font-bold text-chili underline underline-offset-4">{t("viewSummary")}</span></span>
          <span className="font-display text-2xl font-extrabold">{money(total)}</span>
        </button>
        <CheckoutButton total={total} />
      </div>
      {sheet && (
        <div className="fixed inset-0 z-50 flex items-end bg-espresso/60 lg:hidden" onClick={() => setSheet(false)}>
          <div role="dialog" aria-modal="true" aria-label={t("summary")} onClick={(e) => e.stopPropagation()} className="sheet-in max-h-[90vh] w-full overflow-y-auto rounded-t-[32px] bg-cream p-4 pb-6 text-ink">
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-ink/20" />
            <div className="mb-2 flex justify-end"><IconButton icon="x" label={t("closeSummary")} onClick={() => setSheet(false)} className="bg-paper" /></div>
            <Summary count={itemCount} sub={subtotal} discount={discount} total={total} cta={cta} />
          </div>
        </div>
      )}
    </div>
  );
}
