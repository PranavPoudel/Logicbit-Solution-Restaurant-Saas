// components/restaurant/storefront-reviews-section.tsx
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { getRestaurantReviews, type Review } from "@/lib/api/reviews";
import { Button, Icon, Squiggle } from "@/components/ui/primitives";
import { Pager } from "@/components/ui/pager";
import { SortMenu } from "@/components/ui/sort-menu";

const PAGE_SIZE = 4;
const AVATARS = ["bg-chili text-parchment", "bg-saffron text-espresso", "bg-herb text-parchment", "bg-ink text-cream"];
const TINTS = ["bg-paper", "bg-saffron/15", "bg-herb/10", "bg-paper"];
const RATE_LINK = "shadow-red inline-flex h-14 items-center justify-center gap-2 rounded-full bg-[var(--accent,var(--brand-chili))] px-7 text-lg font-bold text-[var(--accent-ink,var(--brand-parchment))] transition hover:-translate-y-0.5";
type Filter = "all" | 5 | 4 | 3;
type Sort = "newest" | "high" | "low";

const average = (reviews: Review[]) => reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

function Stars({ n, size = "h-5 w-5" }: { n: number; size?: string }) {
  const t = useTranslations("review");
  return (
    <span className="inline-flex gap-0.5" role="img" aria-label={t("starsOf", { n: n.toFixed(1) })}>
      {[1, 2, 3, 4, 5].map((i) => <Icon key={i} name="star" fill className={`${size} ${i <= Math.round(n) ? "text-saffron" : "text-ink/15"}`} />)}
    </span>
  );
}

function Summary({ reviews, rating, total, filter, onBar }: { reviews: Review[]; rating: number; total: number; filter: Filter; onBar: (f: Filter) => void }) {
  const t = useTranslations("review");
  const counts = [5, 4, 3, 2, 1].map((s) => reviews.filter((r) => r.rating === s).length);
  return (
    <div className="shadow-soft relative grid gap-6 rounded-[32px] bg-paper p-6 md:grid-cols-[auto_1fr_auto] md:items-center md:gap-10 md:p-8">
      {rating >= 4.5 && <span className="shadow-hard absolute -top-4 right-6 rotate-6 rounded-xl bg-saffron px-3 py-1 font-display text-base font-extrabold text-espresso md:left-36 md:right-auto">{t("favourite")}</span>}
      <div>
        <p className="font-display text-[88px] font-extrabold leading-[.85] tracking-[-0.05em] md:text-[112px]">{rating.toFixed(1)}</p>
        <Stars n={rating} size="h-6 w-6" />
        <p className="mt-1 text-ink/80">{t("fromCount", { count: total })}</p>
      </div>
      <ul className="space-y-2" aria-label={t("breakdown")}>
        {[5, 4, 3, 2, 1].map((s, i) => {
          const on = filter === s || (filter === 3 && s < 3);
          return (
            <li key={s}>
              <button type="button" onClick={() => onBar(s >= 4 ? (s as 5 | 4) : 3)} aria-pressed={on} aria-label={t("showStars", { stars: s, count: counts[i] })} className={`group flex min-h-11 w-full items-center gap-3 rounded-full px-2 transition hover:bg-ink/5 ${on ? "bg-[var(--accent,var(--brand-chili))]/10" : ""}`}>
                <span className="w-8 shrink-0 font-bold">{s}★</span>
                <span className="h-3.5 flex-1 overflow-hidden rounded-full bg-ink/10">
                  <span className={`block h-full rounded-full transition-all ${on ? "bg-[var(--accent,var(--brand-chili))]" : "bg-saffron group-hover:bg-[var(--accent,var(--brand-chili))]"}`} style={{ width: `${Math.max(2, (counts[i] / reviews.length) * 100)}%` }} />
                </span>
                <span className="w-10 shrink-0 text-right text-ink/80">{counts[i]}</span>
              </button>
            </li>
          );
        })}
      </ul>
      <Link href="/account" className={`${RATE_LINK} md:self-center`}><Icon name="star" className="h-5 w-5" />{t("rateFromOrders")}</Link>
    </div>
  );
}

function ReviewCard({ review, index }: { review: Review; index: number }) {
  const t = useTranslations("review");
  const locale = useLocale();
  const [more, setMore] = useState(false);
  const name = review.customer?.name || review.customerName || t("anonymous");
  const long = (review.comment ?? "").length > 160;
  return (
    <article className={`${TINTS[index % 4]} ${index % 3 === 1 ? "md:rotate-[.6deg]" : index % 3 === 2 ? "md:-rotate-[.6deg]" : ""} shadow-soft mb-6 break-inside-avoid rounded-[28px] p-5 md:p-6`}>
      <header className="flex items-start gap-3">
        <span className={`blob grid h-12 w-12 shrink-0 place-items-center font-display text-xl font-extrabold ${AVATARS[index % 4]}`} aria-hidden>{name.charAt(0).toUpperCase()}</span>
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <b className="text-lg">{name}</b>
            <span className="inline-flex items-center gap-1 rounded-full bg-herb/15 px-2 font-bold text-herb"><Icon name="check" className="h-4 w-4" />{t("verified")}</span>
          </p>
          <p className="flex items-center gap-2 text-ink/75"><Stars n={review.rating} size="h-4 w-4" /><span>· {new Date(review.createdAt).toLocaleDateString(locale)}</span></p>
        </div>
      </header>
      {review.comment && <p className={`mt-4 text-lg leading-relaxed ${more ? "" : "line-clamp-4"}`}>{review.comment}</p>}
      {long && <button type="button" onClick={() => setMore(!more)} aria-expanded={more} className="min-h-11 font-bold underline underline-offset-4">{more ? t("showLess") : t("readMore")}</button>}
    </article>
  );
}

export function StorefrontReviewsSection({ title, restaurantId, rating, total }: { title: string; restaurantId: string; rating?: number; total?: number }) {
  const t = useTranslations("review");
  const tc = useTranslations("common");
  const { data: reviews = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["restaurant-reviews", restaurantId],
    queryFn: () => getRestaurantReviews(restaurantId),
    enabled: !!restaurantId,
  });
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("newest");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const list = reviews.filter((r) => filter === "all" || (filter === 3 ? r.rating <= 3 : r.rating === filter));
    const by = { newest: (a: Review, b: Review) => +new Date(b.createdAt) - +new Date(a.createdAt), high: (a: Review, b: Review) => b.rating - a.rating, low: (a: Review, b: Review) => a.rating - b.rating }[sort];
    return [...list].sort(by);
  }, [reviews, filter, sort]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const setF = (f: Filter) => { setFilter(f); setPage(1); };

  const chips: [Filter, string][] = [["all", t("fAll")], [5, t("f5")], [4, t("f4")], [3, t("f3")]];

  return (
    <section aria-labelledby="rv" className="mx-auto w-full max-w-[1440px] border-t border-ink/10 px-5 pt-10 md:px-10">
      <h2 id="rv" className="relative inline-block font-display text-[32px] font-extrabold tracking-tight md:text-[40px]">
        {title}
        <Squiggle className="absolute -bottom-1 left-0 h-3 w-full text-[var(--accent,var(--brand-chili))]" />
      </h2>

      {isError ? (
        <div role="alert" className="mt-8 flex flex-wrap items-center gap-4 rounded-[28px] border-2 border-dashed border-chili/50 bg-chili/5 p-6">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-chili/10 text-chili"><Icon name="alert" /></span>
          <p className="flex-1 text-lg font-bold">{t("errLoad")}</p>
          <Button variant="ink" onClick={() => refetch()}>{tc("retry")}</Button>
        </div>
      ) : isLoading ? (
        <div className="mt-8 columns-1 gap-6 md:columns-2" aria-busy="true">
          {[0, 1, 2, 3].map((i) => <div key={i} className="mb-6 h-40 animate-pulse break-inside-avoid rounded-[28px] bg-ink/10" />)}
        </div>
      ) : reviews.length === 0 ? (
        <div role="status" className="mt-8 rounded-[32px] border-2 border-dashed border-ink/20 px-6 py-12 text-center">
          <Icon name="star" fill className="mx-auto h-12 w-12 text-saffron" />
          <p className="mt-4 font-display text-[28px] font-extrabold leading-tight">{t("noReviews")}</p>
          <Link href="/account" className={`${RATE_LINK} mt-6`}>{t("rateFromOrders")}</Link>
        </div>
      ) : (
        <>
          <div className="mt-8"><Summary reviews={reviews} rating={rating || average(reviews)} total={total || reviews.length} filter={filter} onBar={setF} /></div>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <div className="no-scrollbar -mx-5 flex flex-1 gap-2 overflow-x-auto px-5 md:mx-0 md:px-0" role="group" aria-label={t("filterLabel")}>
              {chips.map(([k, label]) => (
                <button key={String(k)} type="button" onClick={() => setF(k)} aria-pressed={filter === k} className={`min-h-11 shrink-0 rounded-full border-2 px-4 font-bold transition ${filter === k ? "border-[var(--accent,var(--brand-chili))] bg-[var(--accent,var(--brand-chili))] text-[var(--accent-ink,var(--brand-parchment))]" : "border-ink/15 bg-paper hover:border-ink"}`}>{label}</button>
              ))}
            </div>
            <SortMenu
              label={t("sort")}
              value={sort}
              options={[{ value: "newest", label: t("sortNewest") }, { value: "high", label: t("sortHigh") }, { value: "low", label: t("sortLow") }]}
              onChange={(s: Sort) => { setSort(s); setPage(1); }}
            />
          </div>

          <div className="mt-8">
            {filtered.length === 0 ? (
              <p className="rounded-[28px] bg-paper p-6 text-center text-lg">
                {t("noMatch")} <button type="button" onClick={() => setF("all")} className="font-bold underline underline-offset-4">{t("showAll")}</button>
              </p>
            ) : (
              <div className="columns-1 gap-6 md:columns-2">
                {filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((r, i) => <ReviewCard key={r.id} review={r} index={i} />)}
              </div>
            )}
            <Pager page={page} pageCount={pageCount} onChange={setPage} />
          </div>
        </>
      )}
    </section>
  );
}
