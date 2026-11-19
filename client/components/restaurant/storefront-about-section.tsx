// components/restaurant/storefront-about-section.tsx
import { useTranslations } from "next-intl";
import { Icon } from "@/components/ui/primitives";
import { getFullImageUrl } from "@/lib/utils/image";
import { isFacilityKey } from "@/lib/facilities";
import { OpeningHours } from "@/components/restaurant/opening-hours";
import type { RestaurantDetail } from "@/types/menu";

type RestaurantExtras = {
  supportsCod?: boolean;
  supportsCreditCard?: boolean;
  supportsEsewa?: boolean;
  supportsKhalti?: boolean;
  supportsIps?: boolean;
  supportsPhonePay?: boolean;
  supportsPaypay?: boolean;
  facilities?: string[];
};

function InfoBlock({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div className="rounded-[24px] border-2 border-ink/10 bg-cream/40 p-5">
      <h3 className="font-display text-xl font-extrabold">{title}</h3>
      <ul className="mt-3 flex flex-wrap gap-2">
        {items.map((item) => (
          <li key={item} className="inline-flex min-h-10 items-center gap-2 rounded-full bg-ink/10 px-4 text-base font-bold">
            <span aria-hidden className="text-herb">✓</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function StorefrontAboutSection({ title, aboutText, restaurant }: { title: string; aboutText?: string | null; restaurant: RestaurantDetail }) {
  const t = useTranslations("restaurant");
  const rated = (restaurant.avgRating ?? 0) > 0;
  const r = restaurant as RestaurantDetail & RestaurantExtras;

  const payments = [
    r.supportsCod && t("payCash"),
    r.supportsCreditCard && t("payCreditCard"),
    r.supportsPaypay && "PayPay",
    r.supportsEsewa && "eSewa",
    r.supportsKhalti && "Khalti",
    r.supportsPhonePay && "PhonePe",
    r.supportsIps && t("payBankTransfer"),
  ].filter(Boolean) as string[];

  const facilities = (r.facilities ?? []).filter(isFacilityKey).map((key) => t(`facility.${key}`));
  const hasInfo = payments.length > 0 || facilities.length > 0;

  return (
    <section aria-labelledby="about" className="mx-auto w-full max-w-[1440px] border-t border-ink/10 px-5 py-10 md:px-10">
      <h2 id="about" className="relative inline-block font-display text-[32px] font-extrabold tracking-tight md:text-[40px]">
        {title}
      </h2>
      <div className="shadow-warm relative mt-8 overflow-hidden rounded-[32px] bg-paper p-6 md:p-10">
        {aboutText && (
          <>
          <span aria-hidden className="pointer-events-none absolute right-6 top-2 select-none font-display text-[120px] font-extrabold leading-none text-[var(--accent,var(--brand-chili))] opacity-10 md:right-10 md:text-[140px]">”</span>
          <div className="relative flex flex-col gap-6 md:flex-row md:items-start md:gap-10">
            {restaurant.logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={getFullImageUrl(restaurant.logoUrl)} alt="" className="h-24 w-24 shrink-0 rounded-3xl border-4 border-cream object-cover shadow-soft md:h-32 md:w-32" />
            )}
            <div className="min-w-0 flex-1">
              <p className="max-w-3xl whitespace-pre-wrap font-display text-2xl font-bold leading-snug md:text-3xl">{aboutText}</p>
              <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-ink/10 pt-4">
                <span className="font-bold">{restaurant.name}</span>
                {rated && (
                  <span className="inline-flex items-center gap-1 font-bold text-ink/75">
                    <Icon name="star" fill className="h-4 w-4 text-chili" />{restaurant.avgRating!.toFixed(1)}
                    {restaurant.totalReviews ? <span className="font-normal">({restaurant.totalReviews})</span> : null}
                  </span>
                )}
                {restaurant.city && <span className="inline-flex items-center gap-1 text-ink/75"><Icon name="pin" className="h-4 w-4" />{restaurant.city}</span>}
              </div>
            </div>
          </div>
          </>
        )}

        {hasInfo && (
          <div className={`grid gap-4 md:grid-cols-2 ${aboutText ? "mt-8 border-t border-ink/10 pt-8" : ""}`}>
            <InfoBlock title={t("paymentsTitle")} items={payments} />
            <InfoBlock title={t("facilitiesTitle")} items={facilities} />
          </div>
        )}

        <OpeningHours restaurant={restaurant} divided={!!aboutText || hasInfo} />
      </div>
    </section>
  );
}
