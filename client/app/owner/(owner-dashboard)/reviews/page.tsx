//app/owner/(owner-dashboard)/reviews/page.tsx
"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Star, MessageSquare, AlertCircle } from "lucide-react";
import { useOwnerAuthStore } from "@/store/owner-auth-store";
import { getRestaurantReviews, type Review } from "@/lib/api/reviews";

type SortKey = "newest" | "highest" | "lowest";

const SORTS: { key: SortKey; label: string; compare: (a: Review, b: Review) => number }[] = [
  { key: "newest", label: "Newest", compare: (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt) },
  { key: "highest", label: "Highest", compare: (a, b) => b.rating - a.rating },
  { key: "lowest", label: "Lowest", compare: (a, b) => a.rating - b.rating },
];

const chip =
  "inline-flex min-h-11 items-center rounded-full border px-4 text-sm font-medium transition-colors duration-150 motion-reduce:transition-none outline-none focus-visible:ring-2 focus-visible:ring-[#E3A008] focus-visible:ring-offset-1";

function Stars({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" role="img" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} size={size} aria-hidden="true" className={n <= Math.round(rating) ? "fill-[#E3A008] text-[#E3A008]" : "text-neutral-300"} />
      ))}
    </span>
  );
}

function ReviewsSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[22rem_minmax(0,1fr)]" aria-busy="true" aria-label="Loading reviews">
      <div className="h-72 animate-pulse rounded-xl bg-neutral-100 motion-reduce:animate-none" />
      <div className="space-y-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-xl bg-neutral-100 motion-reduce:animate-none" />
        ))}
      </div>
    </div>
  );
}

export default function OwnerReviewsPage() {
  const restaurantId = useOwnerAuthStore((s) => s.activeRestaurantId);
  const [star, setStar] = useState<number | null>(null);
  const [sort, setSort] = useState<SortKey>("newest");

  const { data: reviews = [], isLoading, isError } = useQuery({
    queryKey: ["owner-reviews", restaurantId],
    queryFn: () => getRestaurantReviews(restaurantId as string),
    enabled: !!restaurantId,
  });

  const average = reviews.length ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;
  const distribution = [5, 4, 3, 2, 1].map((n) => ({ star: n, count: reviews.filter((r) => r.rating === n).length }));
  const shown = reviews.filter((r) => star === null || r.rating === star).sort(SORTS.find((s) => s.key === sort)!.compare);

  if (!restaurantId) {
    return (
      <div className="max-w-6xl mx-auto flex flex-col items-center text-center gap-3 py-16">
        <AlertCircle className="text-neutral-300" size={28} />
        <p className="text-sm text-neutral-500">No restaurant selected. Use the restaurant switcher in the top bar.</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-6xl mx-auto flex flex-col items-center text-center gap-3 py-16">
        <AlertCircle className="text-red-300" size={28} />
        <p className="text-sm text-neutral-500">Failed to load reviews. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">Customer Reviews</h1>
        <p className="mt-1 text-sm text-neutral-600">See what your customers are saying about your restaurant.</p>
      </div>

      {isLoading ? (
        <ReviewsSkeleton />
      ) : reviews.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-12 text-center">
          <MessageSquare className="mx-auto mb-3 h-12 w-12 text-neutral-300" aria-hidden="true" />
          <p className="text-sm font-medium text-neutral-900">No reviews yet</p>
          <p className="mt-1 text-sm text-neutral-600">Reviews appear here once customers rate their orders.</p>
        </div>
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-[22rem_minmax(0,1fr)]">
          <section aria-labelledby="rating-summary" className="rounded-xl border border-neutral-200 bg-white p-6 lg:sticky lg:top-6">
            <h2 id="rating-summary" className="sr-only">
              Rating summary
            </h2>
            <div className="flex items-end gap-4">
              <p className="text-5xl font-bold tabular-nums leading-none text-neutral-900">{average.toFixed(1)}</p>
              <div className="pb-0.5">
                <Stars rating={average} size={18} />
                <p className="mt-1 text-sm text-neutral-600">
                  {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
                </p>
              </div>
            </div>

            <ul className="mt-6 space-y-1">
              {distribution.map(({ star: n, count }) => {
                const active = star === n;
                return (
                  <li key={n}>
                    <button
                      type="button"
                      disabled={count === 0}
                      aria-pressed={active}
                      aria-label={`${n} star reviews: ${count}. ${active ? "Showing only these" : "Show only these"}`}
                      onClick={() => setStar(active ? null : n)}
                      className={`flex min-h-11 w-full items-center gap-3 rounded-lg px-2 text-left outline-none transition-colors duration-150 motion-reduce:transition-none focus-visible:ring-2 focus-visible:ring-[#E3A008] enabled:hover:bg-neutral-50 disabled:cursor-default ${active ? "bg-neutral-100" : ""}`}
                    >
                      <span className="flex w-8 items-center gap-1 text-sm font-medium text-neutral-800">
                        {n}
                        <Star size={12} aria-hidden="true" className="fill-[#E3A008] text-[#E3A008]" />
                      </span>
                      <span className="h-2 flex-1 overflow-hidden rounded-full bg-neutral-100">
                        <span className="block h-full rounded-full bg-[#E3A008] transition-[width] duration-300 motion-reduce:transition-none" style={{ width: `${(count / reviews.length) * 100}%` }} />
                      </span>
                      <span className="w-6 text-right text-sm tabular-nums text-neutral-600">{count}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>

          <section aria-labelledby="review-list" className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 id="review-list" className="text-sm font-semibold text-neutral-900">
                {star === null ? "All reviews" : `${star}-star reviews`}
                <span className="ml-2 font-normal text-neutral-600">
                  {shown.length} of {reviews.length}
                </span>
              </h2>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Sort reviews">
                {SORTS.map((s) => (
                  <button
                    key={s.key}
                    type="button"
                    aria-pressed={sort === s.key}
                    onClick={() => setSort(s.key)}
                    className={`${chip} ${sort === s.key ? "border-[#111827] bg-[#111827] text-white" : "border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50"}`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <ul className="space-y-3">
              {shown.map((review) => (
                <li key={review.id} className="rounded-xl border border-neutral-200 bg-white p-5">
                  <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                    <div className="flex items-center gap-3">
                      <Stars rating={review.rating} />
                      {review.customerName && <span className="text-sm font-medium text-neutral-900">{review.customerName}</span>}
                    </div>
                    <time dateTime={review.createdAt} className="text-sm text-neutral-600">
                      {new Date(review.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                    </time>
                  </div>
                  {review.comment ? (
                    <p className="mt-3 text-base leading-relaxed text-neutral-800">{review.comment}</p>
                  ) : (
                    <p className="mt-3 text-sm italic text-neutral-500">No written comment</p>
                  )}
                  {review.orderNumber && (
                    <p className="mt-3 text-sm text-neutral-600">
                      Order <span className="font-mono">{review.orderNumber}</span>
                    </p>
                  )}
                </li>
              ))}
            </ul>

            {shown.length === 0 && (
              <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-8 text-center">
                <p className="text-sm text-neutral-600">No {star}-star reviews.</p>
                <button type="button" onClick={() => setStar(null)} className={`${chip} mt-3 border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50`}>
                  Show all reviews
                </button>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
