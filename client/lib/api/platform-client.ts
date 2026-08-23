// lib/api/platform-client.ts — Platform Admin portal API client
import { createApiClient } from "@/lib/api/create-api-client";
import { usePlatformAuthStore } from "@/store/platform-auth-store";

// Confirmed: platform-auth only has /platform-auth/login, no refresh
// endpoint listed. 401 logs the staff member out directly.
export const platformApiClient = createApiClient({
  refreshPath: null,
  auth: {
    getAccessToken: () => usePlatformAuthStore.getState().accessToken,
    getRefreshToken: () => usePlatformAuthStore.getState().refreshToken,
    setAccessToken: (token) => usePlatformAuthStore.getState().setAccessToken(token),
    logout: () => usePlatformAuthStore.getState().logout(),
  },
});
