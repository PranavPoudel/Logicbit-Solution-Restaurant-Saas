// store/owner-auth-store.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { OwnerUser, Restaurant } from "@/types/owner";

interface OwnerAuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: OwnerUser | null;
  restaurants: Restaurant[];
  activeRestaurantId: string | null;
  isAuthenticated: boolean;

  setAuth: (params: {
    accessToken: string;
    refreshToken: string;
    user: OwnerUser;
    restaurants?: Restaurant[];
  }) => void;
  setAccessToken: (accessToken: string) => void;
  setActiveRestaurant: (restaurantId: string) => void;
  setRestaurants: (restaurants: Restaurant[]) => void;
  logout: () => void;
}

export const useOwnerAuthStore = create<OwnerAuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      restaurants: [],
      activeRestaurantId: null,
      isAuthenticated: false,

      setAuth: ({ accessToken, refreshToken, user, restaurants = [] }) =>
        set({
          accessToken,
          refreshToken,
          user,
          restaurants,
          isAuthenticated: true,
          // default to first restaurant unless one is already selected
          activeRestaurantId: get().activeRestaurantId ?? restaurants[0]?.id ?? null,
        }),

      setAccessToken: (accessToken) => set({ accessToken }),

      setActiveRestaurant: (restaurantId) =>
        set({ activeRestaurantId: restaurantId }),

      setRestaurants: (restaurants) =>
        set((state) => ({
          restaurants,
          activeRestaurantId: state.activeRestaurantId ?? restaurants[0]?.id ?? null,
        })),

      logout: () =>
        set({
          accessToken: null,
          refreshToken: null,
          user: null,
          restaurants: [],
          activeRestaurantId: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: "logicbit-owner-auth", // separate localStorage key from customer auth
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
        restaurants: state.restaurants,
        activeRestaurantId: state.activeRestaurantId,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
