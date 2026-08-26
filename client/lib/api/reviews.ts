// lib/api/reviews.ts — Module 12: Review
import { apiClient } from "@/lib/api/client";
import { ownerApiClient } from "@/lib/api/owner-client";

// Confirmed against server CreateReviewDto: restaurantId is required,
// orderId is optional (only present for verified-purchase reviews).
export interface CreateReviewInput {
  restaurantId: string;
  orderId?: string;
  rating: number;
  comment?: string;
}

export interface OwnerReview {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  customer: { id: string; name: string } | null;
}

// Customer — order-verified only
export async function createReview(input: CreateReviewInput) {
  const { data } = await apiClient.post("/reviews", input);
  return data;
}

// Public listing lives in discovery.ts as getRestaurantReviews()

// Owner — same public discovery route, called via the owner-authenticated
// client so it's consistent with every other owner-dashboard API call.
// There is no separate /owner reviews endpoint on the backend; the
// controller only exposes POST /reviews and the public discovery GET.
export const reviewsApi = {
  list: async (restaurantId: string): Promise<OwnerReview[]> =>
    (await ownerApiClient.get(`/discovery/restaurants/${restaurantId}/reviews`)).data,
};
