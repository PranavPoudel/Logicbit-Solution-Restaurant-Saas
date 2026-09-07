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

// Backend expects different field names - we transform at the API boundary
function toBackendPayload(input: any) {
  return {
    code: input.code,
    type: input.discountType,      // discountType → type
    value: input.discountValue,     // discountValue → value
    minOrderAmount: input.minSubtotal, // minSubtotal → minOrderAmount
    validUntil: input.expiresAt,    // expiresAt → validUntil
    validFrom: input.validFrom,     // NEW field
    maxDiscount: input.maxDiscount, // NEW field
    usageLimit: input.usageLimit,   // NEW field
    usageLimitPerCustomer: input.usageLimitPerCustomer, // NEW field
  };
}

function fromBackendResponse(data: any) {
  return {
    ...data,
    discountType: data.type,        // type → discountType
    discountValue: data.value,      // value → discountValue
    minSubtotal: data.minOrderAmount, // minOrderAmount → minSubtotal
    expiresAt: data.validUntil,     // validUntil → expiresAt
    validFrom: data.validFrom,      // Keep as is
    maxDiscount: data.maxDiscount,
    usageLimit: data.usageLimit,
    usageLimitPerCustomer: data.usageLimitPerCustomer,
  };
}

// Owner
export const couponsApi = {
  create: async (restaurantId: string, input: any) => {
    const { data } = await ownerApiClient.post(
      `/restaurants/${restaurantId}/coupons`,
      toBackendPayload(input)
    );
    return fromBackendResponse(data);
  },
  
  list: async (restaurantId: string) => {
    const { data } = await ownerApiClient.get(`/restaurants/${restaurantId}/coupons`);
    // Transform array of coupons
    return (Array.isArray(data) ? data : []).map(fromBackendResponse);
  },
  
  get: async (restaurantId: string, id: string) => {
    const { data } = await ownerApiClient.get(`/restaurants/${restaurantId}/coupons/${id}`);
    return fromBackendResponse(data);
  },
  
  update: async (restaurantId: string, id: string, input: Partial<any>) => {
    const { data } = await ownerApiClient.patch(
      `/restaurants/${restaurantId}/coupons/${id}`,
      toBackendPayload(input)
    );
    return fromBackendResponse(data);
  },
  
  remove: async (restaurantId: string, id: string) => {
    const { data } = await ownerApiClient.delete(`/restaurants/${restaurantId}/coupons/${id}`);
    return data;
  },
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