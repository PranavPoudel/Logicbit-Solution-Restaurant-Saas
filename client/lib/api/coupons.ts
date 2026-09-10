// lib/api/coupons.ts
import { ownerApiClient } from "@/lib/api/owner-client";

export interface CouponInput {
  code?: string; // 🆕 Made optional
  discountType: "PERCENTAGE" | "FLAT";
  discountValue: number;
  minSubtotal?: number;
  maxDiscount?: number;
  usageLimit?: number;
  usageLimitPerCustomer?: number;
  validFrom?: string;
  expiresAt?: string;
  isAutoApply?: boolean; // 🆕 Added
  [key: string]: unknown;
}

function toBackendPayload(input: any) {
  return {
    code: input.code || null, // Send null if empty
    type: input.discountType,
    value: input.discountValue,
    minOrderAmount: input.minSubtotal,
    validUntil: input.expiresAt,
    validFrom: input.validFrom,
    maxDiscount: input.maxDiscount,
    usageLimit: input.usageLimit,
    usageLimitPerCustomer: input.usageLimitPerCustomer,
    isAutoApply: input.isAutoApply || false, // 🆕 Added
  };
}

function fromBackendResponse(data: any) {
  return {
    ...data,
    discountType: data.type,
    discountValue: data.value,
    minSubtotal: data.minOrderAmount,
    expiresAt: data.validUntil,
    validFrom: data.validFrom,
    maxDiscount: data.maxDiscount,
    usageLimit: data.usageLimit,
    usageLimitPerCustomer: data.usageLimitPerCustomer,
    isAutoApply: data.isAutoApply || false, // 🆕 Added
  };
}

export const couponsApi = {
  list: async (restaurantId: string, includeDeleted = false) => {
    const { data } = await ownerApiClient.get(`/restaurants/${restaurantId}/coupons`, { params: { includeDeleted } });
    return (Array.isArray(data) ? data : []).map(fromBackendResponse);
  },
  create: async (restaurantId: string, input: CouponInput) => {
    const { data } = await ownerApiClient.post(`/restaurants/${restaurantId}/coupons`, toBackendPayload(input));
    return fromBackendResponse(data);
  },
  update: async (restaurantId: string, id: string, input: Partial<CouponInput>) => {
    const { data } = await ownerApiClient.patch(`/restaurants/${restaurantId}/coupons/${id}`, toBackendPayload(input));
    return fromBackendResponse(data);
  },
  remove: async (restaurantId: string, id: string) => {
    const { data } = await ownerApiClient.delete(`/restaurants/${restaurantId}/coupons/${id}`);
    return data;
  },
  restore: async (restaurantId: string, id: string) => {
    const { data } = await ownerApiClient.post(`/restaurants/${restaurantId}/coupons/${id}/restore`);
    return data;
  },
  permanentDelete: async (restaurantId: string, id: string) => {
    const { data } = await ownerApiClient.delete(`/restaurants/${restaurantId}/coupons/${id}/permanent`);
    return data;
 },
};