// lib/api/owner-client.ts — Restaurant Owner/Staff portal API client
import { createApiClient } from "@/lib/api/create-api-client";
import { useOwnerAuthStore } from "@/store/owner-auth-store";

// Confirmed against the API list: refresh is POST /auth/refresh.
// Restaurant scoping is a URL path param (/restaurants/:restaurantId/...),
// not a header — so no getExtraHeaders here. Build restaurant-scoped URLs
// using useOwnerAuthStore.getState().activeRestaurantId, e.g.:
//   ownerApiClient.get(`/restaurants/${restaurantId}/orders`)
export const ownerApiClient = createApiClient({
  refreshPath: "/auth/refresh",
  auth: {
    getAccessToken: () => useOwnerAuthStore.getState().accessToken,
    getRefreshToken: () => useOwnerAuthStore.getState().refreshToken,
    setAccessToken: (token) => useOwnerAuthStore.getState().setAccessToken(token),
    logout: () => useOwnerAuthStore.getState().logout(),
  },
});
