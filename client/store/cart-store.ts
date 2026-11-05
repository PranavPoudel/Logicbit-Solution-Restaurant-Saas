import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CouponPreview } from "@/lib/api/orders";
import { playSound } from "@/lib/utils/sound";

export interface SelectedModifier {
  modifierGroupId: string;
  modifierOptionId: string;
  groupName?: string;
  optionName?: string;
  allergenInfo?: string;
  priceDelta: number;
}

export interface CartItem {
  id: string;
  menuItemId: string;
  restaurantId: string;
  name: string;
  price: number;
  quantity: number;
  selectedModifiers?: SelectedModifier[];
  notes?: string; // 🆕 ADDED: Per-item special instructions
  image?: string;
  allergenInfo?: string;
  /** Distinguishes variants so they don't merge incorrectly */
  variantKey: string;
}

interface CartState {
  restaurantId: string | null;
  items: CartItem[];
  coupon: CouponPreview | null;
  setCoupon: (coupon: CouponPreview | null) => void;
  itemCount: () => number;
  subtotal: () => number;
  discount: () => number;
  lastRestaurantId: string | null;
  activeRestaurantId: () => string | null;
  addItem: (item: Omit<CartItem, "quantity" | "variantKey"> & {
    quantity?: number;
    variantKey?: string;
  }) => void;
  removeOneOrAll: (menuItemId: string, variantKey?: string) => void;
  removeItem: (menuItemId: string, variantKey?: string) => void;
  clear: () => void;
}

function lineKey(menuItemId: string, variantKey: string) {
  return `${menuItemId}::${variantKey}`;
}

function afterRemove(state: CartState, items: CartItem[]) {
  if (items.length) return { items };
  return { items, restaurantId: null, coupon: null, lastRestaurantId: state.activeRestaurantId() ?? state.lastRestaurantId };
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      restaurantId: null,
      lastRestaurantId: null,
      items: [],
      coupon: null,
      setCoupon: (coupon) => set({ coupon }),
      itemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
      subtotal: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
      activeRestaurantId: () => get().restaurantId || get().items.find((i) => i.restaurantId)?.restaurantId || null,
      discount: () => {
        const { coupon, subtotal } = get();
        return coupon ? Math.min(coupon.discountAmount, subtotal()) : 0;
      },

      addItem: (item) => {
        playSound("added");
        set((state) => {
          // 🆕 Include notes in variantKey so different notes create separate cart lines
          const variantKey = item.variantKey ?? (item.notes ? `notes:${item.notes}` : "");
          const key = lineKey(item.menuItemId, variantKey);
          
          const existing = state.items.find(
            (i) => lineKey(i.menuItemId, i.variantKey) === key
          );
          
          if (existing) {
            return {
              restaurantId: item.restaurantId,
              items: state.items.map((i) =>
                lineKey(i.menuItemId, i.variantKey) === key
                  ? { ...i, quantity: i.quantity + (item.quantity ?? 1) }
                  : i
              ),
            };
          }
          return {
            restaurantId: item.restaurantId,
            items: [
              ...state.items,
              { ...item, quantity: item.quantity ?? 1, variantKey },
            ],
          };
        });
      },

      removeOneOrAll: (menuItemId, variantKey = "") => {
        const key = lineKey(menuItemId, variantKey);
        if (get().items.some((i) => lineKey(i.menuItemId, i.variantKey) === key)) playSound("removed");
        set((state) => {
          const existing = state.items.find((i) => lineKey(i.menuItemId, i.variantKey) === key);
          if (!existing) return state;
          if (existing.quantity <= 1) {
            return afterRemove(state, state.items.filter((i) => lineKey(i.menuItemId, i.variantKey) !== key));
          }
          return {
            items: state.items.map((i) =>
              lineKey(i.menuItemId, i.variantKey) === key
                ? { ...i, quantity: i.quantity - 1 }
                : i
            ),
          };
        });
      },

      removeItem: (menuItemId, variantKey = "") => {
        playSound("removed");
        set((state) => {
          const key = lineKey(menuItemId, variantKey);
          return afterRemove(state, state.items.filter((i) => lineKey(i.menuItemId, i.variantKey) !== key));
        });
      },

      clear: () => set((state) => afterRemove(state, [])),
    }),
    { name: "logicbit-cart" }
  )
);