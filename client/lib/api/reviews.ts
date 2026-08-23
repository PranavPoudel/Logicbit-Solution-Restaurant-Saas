// lib/api/reviews.ts — Module 12: Review
import { apiClient } from "@/lib/api/client";

// TODO: confirm exact DTO via Swagger (orderId, rating, comment implied).
export interface CreateReviewInput {
  orderId: string;
  rating: number;
  comment?: string;
}

// Customer — order-verified only
export async function createReview(input: CreateReviewInput) {
  const { data } = await apiClient.post("/reviews", input);
  return data;
}

// Public listing lives in discovery.ts as getRestaurantReviews()
