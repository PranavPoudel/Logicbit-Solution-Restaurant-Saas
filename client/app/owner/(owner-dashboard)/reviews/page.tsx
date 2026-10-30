//app/owner/(owner-dashboard)/reviews/page.tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import { Star, MessageSquare, AlertCircle } from "lucide-react";
import { useOwnerAuthStore } from "@/store/owner-auth-store";
import { getRestaurantReviews, type Review } from "@/lib/api/reviews";

export default function OwnerReviewsPage() {
  const restaurantId = useOwnerAuthStore((s) => s.activeRestaurantId);

  const { data: reviews = [], isLoading, isError } = useQuery({
    queryKey: ["owner-reviews", restaurantId],
    queryFn: () => getRestaurantReviews(restaurantId as string),
    enabled: !!restaurantId,
  });

  // Calculate average rating
  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  const ratingDistribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
    percentage: reviews.length > 0
      ? (reviews.filter((r) => r.rating === star).length / reviews.length) * 100
      : 0,
  }));

  if (!restaurantId) {
    return (
      <div className="max-w-6xl mx-auto flex flex-col items-center text-center gap-3 py-16">
        <AlertCircle className="text-neutral-300" size={28} />
        <p className="text-sm text-neutral-500">
          No restaurant selected. Use the restaurant switcher in the top bar.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return <p className="text-sm text-neutral-400 py-12 text-center">Loading reviews…</p>;
  }

  if (isError) {
    return (
      <div className="max-w-6xl mx-auto flex flex-col items-center text-center gap-3 py-16">
        <AlertCircle className="text-red-300" size={28} />
        <p className="text-sm text-neutral-500">
          Failed to load reviews. Please try again later.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">Customer Reviews</h1>
        <p className="text-sm text-neutral-500 mt-1">
          See what your customers are saying about your restaurant.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Average Rating */}
        <div className="bg-white rounded-xl border border-neutral-200 p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-[#E3A008]/10 flex items-center justify-center">
              <Star size={24} className="text-[#E3A008] fill-[#E3A008]" />
            </div>
            <div>
              <p className="text-3xl font-bold text-neutral-900">
                {averageRating.toFixed(1)}
              </p>
              <p className="text-sm text-neutral-500">Average Rating</p>
            </div>
          </div>
        </div>

        {/* Total Reviews */}
        <div className="bg-white rounded-xl border border-neutral-200 p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-[#0F6B5C]/10 flex items-center justify-center">
              <MessageSquare size={24} className="text-[#0F6B5C]" />
            </div>
            <div>
              <p className="text-3xl font-bold text-neutral-900">{reviews.length}</p>
              <p className="text-sm text-neutral-500">Total Reviews</p>
            </div>
          </div>
        </div>

        {/* 5-Star Reviews */}
        <div className="bg-white rounded-xl border border-neutral-200 p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
              <Star size={24} className="text-green-600 fill-green-600" />
            </div>
            <div>
              <p className="text-3xl font-bold text-neutral-900">
                {reviews.filter((r) => r.rating === 5).length}
              </p>
              <p className="text-sm text-neutral-500">5-Star Reviews</p>
            </div>
          </div>
        </div>
      </div>

      {/* Rating Distribution */}
      {reviews.length > 0 && (
        <div className="bg-white rounded-xl border border-neutral-200 p-6">
          <h2 className="text-sm font-semibold text-neutral-900 mb-4">Rating Distribution</h2>
          <div className="space-y-2">
            {ratingDistribution.map(({ star, count, percentage }) => (
              <div key={star} className="flex items-center gap-3">
                <div className="flex items-center gap-1 w-16">
                  <span className="text-sm font-medium text-neutral-700">{star}</span>
                  <Star size={12} className="text-[#E3A008] fill-[#E3A008]" />
                </div>
                <div className="flex-1 h-2 bg-neutral-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#E3A008] rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="text-sm text-neutral-500 w-8 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-neutral-300 p-12 text-center">
            <MessageSquare className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
            <p className="text-sm text-neutral-500">
              No reviews yet. Reviews will appear here once customers rate their orders.
            </p>
          </div>
        ) : (
          reviews.map((review) => (
            <div
              key={review.id}
              className="bg-white rounded-xl border border-neutral-200 p-5 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={16}
                        className={
                          star <= review.rating
                            ? "text-[#E3A008] fill-[#E3A008]"
                            : "text-neutral-200"
                        }
                      />
                    ))}
                  </div>
                  {review.customerName && (
                    <span className="text-sm font-medium text-neutral-900">
                      {review.customerName}
                    </span>
                  )}
                </div>
                <span className="text-xs text-neutral-500">
                  {new Date(review.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>

              {review.orderNumber && (
                <p className="text-xs text-neutral-500">
                  Order: <span className="font-mono">{review.orderNumber}</span>
                </p>
              )}

              {review.comment && (
                <p className="text-sm text-neutral-700 leading-relaxed">
                  {review.comment}
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}