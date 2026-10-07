import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AutoRiderState {
  byRestaurant: Record<string, boolean>;
  setAutoApprove: (restaurantId: string, enabled: boolean) => void;
}

export const useAutoRiderStore = create<AutoRiderState>()(
  persist(
    (set) => ({
      byRestaurant: {},
      setAutoApprove: (restaurantId, enabled) =>
        set((state) => ({ byRestaurant: { ...state.byRestaurant, [restaurantId]: enabled } })),
    }),
    { name: "auto-rider-storage" }
  )
);

export const useAutoApprove = (restaurantId: string | null) =>
  useAutoRiderStore((s) => !!restaurantId && !!s.byRestaurant[restaurantId]);
