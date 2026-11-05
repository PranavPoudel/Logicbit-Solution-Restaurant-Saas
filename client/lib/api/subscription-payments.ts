// lib/api/subscription-payments.ts
import { ownerApiClient } from "@/lib/api/owner-client";

export type SubscriptionPaymentMethod = "PAYPAY" | "CARD";

export interface SubscriptionPlanOption {
  id: string;
  name: string;
  price: number;
  durationMonths: number;
}

export interface SubscriptionPayment {
  id: string;
  planId: string;
  method: SubscriptionPaymentMethod;
  amount: number;
  currencyCode: string;
  status: "PENDING" | "PAID" | "FAILED";
  createdAt: string;
  paidAt: string | null;
}

const base = (restaurantId: string) => `/restaurants/${restaurantId}/subscription-payments`;

export const subscriptionPaymentsApi = {
  plans: async (restaurantId: string): Promise<SubscriptionPlanOption[]> =>
    (await ownerApiClient.get(`${base(restaurantId)}/plans`)).data,
  history: async (restaurantId: string): Promise<SubscriptionPayment[]> =>
    (await ownerApiClient.get(base(restaurantId))).data,
  checkout: async (
    restaurantId: string,
    input: { planId: string; method: SubscriptionPaymentMethod },
  ): Promise<{ paymentId: string; redirectUrl: string }> =>
    (await ownerApiClient.post(`${base(restaurantId)}/checkout`, input)).data,
};
