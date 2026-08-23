// store/platform-auth-store.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface PlatformStaffProfile {
  id: string;
  fullName: string;
  email: string;
  roles?: string[];
  permissions?: string[];
}

interface PlatformAuthState {
  accessToken: string | null;
  refreshToken: string | null;
  staff: PlatformStaffProfile | null;
  isAuthenticated: boolean;

  setAuth: (params: {
    accessToken: string;
    refreshToken?: string;
    staff: PlatformStaffProfile;
  }) => void;
  setAccessToken: (accessToken: string) => void;
  logout: () => void;
}

export const usePlatformAuthStore = create<PlatformAuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      staff: null,
      isAuthenticated: false,

      setAuth: ({ accessToken, refreshToken = null, staff }) =>
        set({ accessToken, refreshToken, staff, isAuthenticated: true }),
      setAccessToken: (accessToken) => set({ accessToken }),
      logout: () =>
        set({ accessToken: null, refreshToken: null, staff: null, isAuthenticated: false }),
    }),
    { name: "logicbit-platform-auth" }
  )
);
