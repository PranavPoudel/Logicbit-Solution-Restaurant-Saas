// components/cart/cart-item-row.tsx
"use client";

import { Plus, Minus, Trash2 } from "lucide-react";
import type { CartItem } from "@/store/cart-store";
import { useCartStore } from "@/store/cart-store";

export function CartItemRow({ item }: { item: CartItem }) {
  const { addItem, removeOneOrAll, removeItem } = useCartStore();

  return (
    <div className="flex items-center gap-3 py-4 border-b border-[#E8E7E2] last:border-0">
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-[#17181C] truncate">{item.name}</h4>
        {item.selectedModifiers && item.selectedModifiers.length > 0 && (
          <p className="text-xs text-neutral-400 mt-0.5 truncate">
            {item.selectedModifiers.map((m) => m.optionName).join(", ")}
          </p>
        )}
        <p className="text-sm font-mono text-neutral-500 mt-0.5">Rs {item.price}</p>
      </div>

      <div className="flex items-center gap-2 shrink-0 bg-[#F7F7F5] rounded-full px-1 py-1">
        <button
          onClick={() => removeOneOrAll(item.menuItemId, item.variantKey)}
          className="w-7 h-7 flex items-center justify-center text-[#17181C]"
          aria-label="Remove one"
        >
          <Minus size={14} />
        </button>
        <span className="text-sm font-mono w-5 text-center">{item.quantity}</span>
        <button
          onClick={() =>
            addItem({
              id: `${item.menuItemId}-${Date.now()}`,
              menuItemId: item.menuItemId,
              restaurantId: item.restaurantId,
              name: item.name,
              price: item.price,
              selectedModifiers: item.selectedModifiers,
              variantKey: item.variantKey,
            })
          }
          className="w-7 h-7 flex items-center justify-center text-[#17181C]"
          aria-label="Add one more"
        >
          <Plus size={14} />
        </button>
      </div>

      <span className="text-sm font-mono font-medium text-[#17181C] w-16 text-right shrink-0">
        Rs {item.price * item.quantity}
      </span>

      <button
        onClick={() => removeItem(item.menuItemId, item.variantKey)}
        className="text-neutral-300 hover:text-red-500 shrink-0"
        aria-label="Remove item"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}
