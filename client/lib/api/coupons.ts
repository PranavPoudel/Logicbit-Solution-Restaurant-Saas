// lib/api/coupons.ts — Module 11: Coupon
import { apiClient } from "@/lib/api/client";
import { ownerApiClient } from "@/lib/api/owner-client";

export interface CouponInput {
  code: string;
  discountType: "PERCENTAGE" | "FLAT";
  discountValue: number;
  minSubtotal?: number;
  expiresAt?: string;
  [key: string]: unknown;
}

// Owner
export const couponsApi = {
  create: async (restaurantId: string, input: CouponInput) =>
    (await ownerApiClient.post(`/restaurants/${restaurantId}/coupons`, input)).data,
  list: async (restaurantId: string) =>
    (await ownerApiClient.get(`/restaurants/${restaurantId}/coupons`)).data,
  get: async (restaurantId: string, id: string) =>
    (await ownerApiClient.get(`/restaurants/${restaurantId}/coupons/${id}`)).data,
  update: async (restaurantId: string, id: string, input: Partial<CouponInput>) =>
    (await ownerApiClient.patch(`/restaurants/${restaurantId}/coupons/${id}`, input)).data,
  remove: async (restaurantId: string, id: string) =>
    (await ownerApiClient.delete(`/restaurants/${restaurantId}/coupons/${id}`)).data,
};

// Customer — checkout preview
export async function validateCoupon(params: {
  restaurantId: string;
  code: string;
  subtotal: number;
}) {
  const { data } = await apiClient.get("/coupons/validate", { params });
  return data;
}
