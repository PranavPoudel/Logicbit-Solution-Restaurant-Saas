import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface PlatformStaffProfile {
  id: string;
  name: string;
  email: string;
  role?: string;
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
      
      logout: () => {
        set({ accessToken: null, refreshToken: null, staff: null, isAuthenticated: false });
        
        if (typeof window !== 'undefined') {
          localStorage.removeItem('admin_token');
          document.cookie = 'admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
          document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
          
          window.location.href = '/admin/login';
        }
      },
    }),
    { name: "logicbit-platform-auth" }
  )
);