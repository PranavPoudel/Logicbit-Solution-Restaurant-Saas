// store/delivery-auth-store.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface DeliveryPersonProfile {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
}

interface DeliveryAuthState {
  accessToken: string | null;
  refreshToken: string | null;
  deliveryPerson: DeliveryPersonProfile | null;
  isAuthenticated: boolean;
  isAvailable: boolean;

  setAuth: (params: {
    accessToken: string;
    refreshToken?: string;
    deliveryPerson: DeliveryPersonProfile;
  }) => void;
  setAccessToken: (accessToken: string) => void;
  setAvailable: (isAvailable: boolean) => void;
  logout: () => void;
}

export const useDeliveryAuthStore = create<DeliveryAuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      deliveryPerson: null,
      isAuthenticated: false,
      isAvailable: false,

      setAuth: ({ accessToken, refreshToken = null, deliveryPerson }) =>
        set({ accessToken, refreshToken, deliveryPerson, isAuthenticated: true }),
      setAccessToken: (accessToken) => set({ accessToken }),
      setAvailable: (isAvailable) => set({ isAvailable }),
      logout: () =>
        set({
          accessToken: null,
          refreshToken: null,
          deliveryPerson: null,
          isAuthenticated: false,
          isAvailable: false,
        }),
    }),
    { name: "logicbit-delivery-auth" }
  )
);
