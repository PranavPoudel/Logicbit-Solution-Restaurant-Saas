// store/chat-context-store.ts
import { create } from "zustand";

export interface ChatRestaurant {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  isOpen: boolean;
  deliveryMinutes?: number;
  categories: string[];
  offerCodes: string[];
}

interface ChatContextState {
  restaurant: ChatRestaurant | null;
  setRestaurant: (restaurant: ChatRestaurant) => void;
  clearRestaurant: () => void;
}

export const useChatContextStore = create<ChatContextState>((set) => ({
  restaurant: null,
  setRestaurant: (restaurant) => set({ restaurant }),
  clearRestaurant: () => set({ restaurant: null }),
}));
