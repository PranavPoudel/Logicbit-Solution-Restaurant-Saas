// store/customer-auth-store.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Customer } from "@/types/api";

interface CustomerAuthState {
  accessToken: string | null;
  refreshToken: string | null;
  customer: Customer | null;
  isAuthenticated: boolean;

  setAuth: (params: {
    accessToken: string;
    refreshToken: string;
    customer: Customer;
  }) => void;
  setAccessToken: (accessToken: string) => void;
  logout: () => void;
}

export const useCustomerAuthStore = create<CustomerAuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      customer: null,
      isAuthenticated: false,

      setAuth: ({ accessToken, refreshToken, customer }) =>
        set({
          accessToken,
          refreshToken,
          customer,
          isAuthenticated: true,
        }),

      setAccessToken: (accessToken) => set({ accessToken }),

      logout: () =>
        set({
          accessToken: null,
          refreshToken: null,
          customer: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: "logicbit-customer-auth", // localStorage key
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        customer: state.customer,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
