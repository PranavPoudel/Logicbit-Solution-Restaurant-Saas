import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CouponPreview } from "@/lib/api/orders";

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

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      restaurantId: null,
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

      addItem: (item) =>
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
        }),

      removeOneOrAll: (menuItemId, variantKey = "") =>
        set((state) => {
          const key = lineKey(menuItemId, variantKey);
          const existing = state.items.find((i) => lineKey(i.menuItemId, i.variantKey) === key);
          if (!existing) return state;
          if (existing.quantity <= 1) {
            const items = state.items.filter((i) => lineKey(i.menuItemId, i.variantKey) !== key);
            return { items, restaurantId: items.length ? state.restaurantId : null, coupon: items.length ? state.coupon : null };
          }
          return {
            items: state.items.map((i) =>
              lineKey(i.menuItemId, i.variantKey) === key
                ? { ...i, quantity: i.quantity - 1 }
                : i
            ),
          };
        }),

      removeItem: (menuItemId, variantKey = "") =>
        set((state) => {
          const key = lineKey(menuItemId, variantKey);
          const items = state.items.filter((i) => lineKey(i.menuItemId, i.variantKey) !== key);
          return { items, restaurantId: items.length ? state.restaurantId : null, coupon: items.length ? state.coupon : null };
        }),

      clear: () => set({ restaurantId: null, items: [], coupon: null }),
    }),
    { name: "logicbit-cart" }
  )
);