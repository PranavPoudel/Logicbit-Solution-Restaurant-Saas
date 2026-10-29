import { create } from "zustand";

interface OwnerNavState {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export const useOwnerNavStore = create<OwnerNavState>()((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
}));
