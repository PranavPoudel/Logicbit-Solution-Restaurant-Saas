// lib/api/delivery-client.ts — Delivery Person portal API client
import { createApiClient } from "@/lib/api/create-api-client";
import { useDeliveryAuthStore } from "@/store/delivery-auth-store";

// Confirmed: delivery-auth only has register/login, no refresh endpoint —
// same pattern as customer-auth. 401 logs the rider out directly.
export const deliveryApiClient = createApiClient({
  refreshPath: null,
  auth: {
    getAccessToken: () => useDeliveryAuthStore.getState().accessToken,
    getRefreshToken: () => useDeliveryAuthStore.getState().refreshToken,
    setAccessToken: (token) => useDeliveryAuthStore.getState().setAccessToken(token),
    logout: () => useDeliveryAuthStore.getState().logout(),
  },
});
