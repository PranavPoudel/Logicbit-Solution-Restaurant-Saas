// lib/api/client.ts — Customer portal API client
import { createApiClient } from "@/lib/api/create-api-client";
import { useCustomerAuthStore } from "@/store/customer-auth-store";

// Confirmed against the API list: customer-auth only has register/login/guest,
// no refresh endpoint. A 401 logs the customer out directly.
export const apiClient = createApiClient({
  refreshPath: null,
  auth: {
    getAccessToken: () => useCustomerAuthStore.getState().accessToken,
    getRefreshToken: () => useCustomerAuthStore.getState().refreshToken,
    setAccessToken: (token) => useCustomerAuthStore.getState().setAccessToken(token),
    logout: () => useCustomerAuthStore.getState().logout(),
  },
});
