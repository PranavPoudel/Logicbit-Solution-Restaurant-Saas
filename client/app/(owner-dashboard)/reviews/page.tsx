// app/(owner-dashboard)/reviews/page.tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Star } from "lucide-react";
import { useOwnerAuthStore } from "@/store/owner-auth-store";
import { reviewsApi, type OwnerReview } from "@/lib/api/reviews";

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((value) => (
        <Star
          key={value}
          size={14}
          className={value <= rating ? "fill-amber-400 text-amber-400" : "text-neutral-300"}
        />
      ))}
    </div>
  );
}

function ReviewRow({ review }: { review: OwnerReview }) {
  const date = new Date(review.createdAt).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="border border-neutral-200 rounded-lg p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-neutral-900">
          {review.customer?.name ?? "Anonymous customer"}
        </span>
        <span className="text-xs text-neutral-400">{date}</span>
      </div>

      <StarRow rating={review.rating} />

      {review.comment && (
        <p className="text-sm text-neutral-600 leading-relaxed">{review.comment}</p>
      )}
    </div>
  );
}

export default function ReviewsPage() {
  const restaurantId = useOwnerAuthStore((s) => s.activeRestaurantId);

  const reviewsQuery = useQuery({
    queryKey: ["owner-reviews", restaurantId],
    queryFn: () => reviewsApi.list(restaurantId as string),
    enabled: !!restaurantId,
  });

  if (!restaurantId) {
    return (
      <div className="max-w-6xl mx-auto flex flex-col items-center text-center gap-3 py-16">
        <AlertTriangle className="text-neutral-300" size={28} />
        <p className="text-sm text-neutral-500">
          No restaurant selected. Use the restaurant switcher in the top bar.
        </p>
      </div>
    );
  }

  const reviews = reviewsQuery.data ?? [];
  const averageRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : null;

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold text-neutral-900 mb-1">Reviews</h1>
      <p className="text-sm text-neutral-500 mb-6">
        What customers are saying about your restaurant.
      </p>

      {reviewsQuery.isLoading ? (
        <p className="text-sm text-neutral-400">Loading reviews…</p>
      ) : reviewsQuery.isError ? (
        <p className="text-sm text-red-500">Could not load reviews. Please try again.</p>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-neutral-400">No reviews yet.</p>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 border border-neutral-200 rounded-lg p-4 bg-neutral-50">
            <span className="text-2xl font-semibold text-neutral-900">{averageRating}</span>
            <div className="flex flex-col">
              <StarRow rating={Math.round(Number(averageRating))} />
              <span className="text-xs text-neutral-500">
                {reviews.length} review{reviews.length === 1 ? "" : "s"}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {reviews.map((review) => (
              <ReviewRow key={review.id} review={review} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
