// lib/api/reviews.ts
import { apiClient } from "@/lib/api/client"; // Adjust path to your actual customer API client

export interface CreateReviewInput {
  orderId: string;
  restaurantId: string;
  rating: number; // 1 to 5
  comment?: string;
}

export async function createReview(input: CreateReviewInput) {
  const { data } = await apiClient.post("/reviews", input);
  return data;
}

// Optional: Fetch if an order has already been reviewed
export async function checkOrderReviewed(orderId: string) {
  const { data } = await apiClient.get(`/reviews/order/${orderId}`);
  return data; // Should return the review object if it exists, or null
}

// ... (keep your existing CreateReviewInput, createReview, and checkOrderReviewed code above)

export interface Review {
  id: string;
  rating: number;
  comment?: string;
  customerName?: string;
  customer?: { name?: string };
  orderNumber?: string;
  createdAt: string;
}

// Fetch reviews for a specific restaurant (uses the public discovery endpoint)
export async function getRestaurantReviews(restaurantId: string): Promise<Review[]> {
  const { data } = await apiClient.get(`/discovery/restaurants/${restaurantId}/reviews`);
  return data || [];
}