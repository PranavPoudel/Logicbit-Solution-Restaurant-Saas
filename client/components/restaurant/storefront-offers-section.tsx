// components/restaurant/storefront-offers-section.tsx
"use client";

import { useTranslations } from "next-intl";
import { useCopy } from "@/hooks/use-copy";
import { useMoney } from "@/hooks/use-money";
import { Icon, Squiggle } from "@/components/ui/primitives";
import type { StorefrontOffer } from "@/lib/api/discovery";

export function StorefrontOffersSection({ title, offers }: { title: string; offers: StorefrontOffer[] }) {
  const t = useTranslations("restaurant");
  const money = useMoney();
  const { copied, copy } = useCopy();
  if (offers.length === 0) return null;

  return (
    <section aria-labelledby="offers" className="mx-auto w-full max-w-[1440px] border-y border-ink/10 px-5 py-10 md:px-10 [&+section]:border-t-0">
      <h2 id="offers" className="relative inline-block font-display text-[32px] font-extrabold tracking-tight md:text-[40px]">
        {title}
        <Squiggle className="absolute -bottom-1 left-0 h-3 w-full text-[var(--accent,var(--brand-chili))]" />
      </h2>
      <ul className="mt-8 grid grid-cols-[repeat(auto-fit,minmax(min(100%,340px),1fr))] gap-4">
        {offers.map((o) => (
          <li key={o.id} className="shadow-warm flex items-center gap-4 rounded-[32px] bg-paper p-6 md:p-8">
            <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-saffron/40 text-espresso"><Icon name="ticket" className="h-7 w-7" /></span>
            <div className="min-w-0 flex-1">
              <p className="font-display text-3xl font-extrabold leading-tight">{o.type === "PERCENTAGE" ? t("offerPercent", { value: o.value }) : t("offerFlat", { amount: money(o.value) })}</p>
              <p className="text-ink/75">
                {o.minOrderAmount ? t("offerMin", { amount: money(o.minOrderAmount) }) : t("offerAny")}
                {o.type === "PERCENTAGE" && o.maxDiscount ? ` · ${t("offerMax", { amount: money(o.maxDiscount) })}` : ""}
              </p>
              {o.code && (
                <button type="button" aria-live="polite" onClick={() => copy(o.code!)} className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-full border-2 border-dashed border-ink/30 px-4 font-mono font-bold transition hover:border-ink active:scale-95">
                  <Icon name={copied === o.code ? "check" : "ticket"} className={`h-4 w-4 ${copied === o.code ? "text-herb" : ""}`} />
                  {copied === o.code ? t("copied") : o.code}
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
