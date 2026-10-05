// components/restaurant/storefront-reviews-section.tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import { Star, MessageCircle } from "lucide-react";
import { getRestaurantReviews } from "@/lib/api/discovery";

interface StorefrontReviewsSectionProps {
  title: string;
  restaurantId: string;
}

export function StorefrontReviewsSection({ title, restaurantId }: StorefrontReviewsSectionProps) {
  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ["restaurant-reviews", restaurantId],
    queryFn: () => getRestaurantReviews(restaurantId),
    enabled: !!restaurantId,
  });

  if (isLoading) {
    return (
      <div className="max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12">
        <h2 className="font-display text-2xl font-bold text-[#2B1410] mb-6">{title}</h2>
        <div className="bg-white border border-[#E8E7E2] rounded-2xl p-8 text-center">
          <p className="text-sm text-[#2B1410]/40">Loading reviews...</p>
        </div>
      </div>
    );
  }

  if (!reviews || reviews.length === 0) {
    return (
      <div className="max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12">
        <h2 className="font-display text-2xl font-bold text-[#2B1410] mb-6">{title}</h2>
        <div className="bg-white border border-[#E8E7E2] rounded-2xl p-8 text-center">
          <MessageCircle className="w-10 h-10 text-[#2B1410]/20 mx-auto mb-3" />
          <p className="text-sm text-[#2B1410]/60">No reviews yet. Be the first to review!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12">
      <h2 className="font-display text-2xl font-bold text-[#2B1410] mb-6">{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {reviews.slice(0, 6).map((review) => (
          <div
            key={review.id}
            className="bg-white border border-[#E8E7E2] rounded-2xl p-5 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-1 mb-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  size={14}
                  className={i < review.rating ? "fill-[#E3A008] text-[#E3A008]" : "text-[#E8E7E2]"}
                />
              ))}
            </div>
            {review.comment && (
              <p className="text-sm text-[#2B1410]/80 line-clamp-3">{review.comment}</p>
            )}
            <p className="text-xs text-[#2B1410]/40 mt-3">
              {new Date(review.createdAt).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}