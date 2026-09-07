// components/menu/menu-item-card.tsx
"use client";

import { Plus, Minus } from "lucide-react";
import type { MenuItem } from "@/types/menu";
import { useCartStore } from "@/store/cart-store";

export function MenuItemCard({
  item,
  restaurantId,
  onOpenModifiers,
}: {
  item: MenuItem;
  restaurantId: string;
  onOpenModifiers: (menuItemId: string) => void;
}) {
  const { items, addItem, removeOneOrAll } = useCartStore();
  const cartItem = items.find((i) => i.menuItemId === item.id && i.variantKey === "");
  const quantity = cartItem?.quantity ?? 0;

  const name = item.name ?? "Menu item";
  const price = item.price ?? 0;
  const isAvailable = item.isAvailable !== false;

  function handleAddClick() {
    if (item.hasModifiers) {
      onOpenModifiers(item.id);
      return;
    }
    addItem({
      id: `${item.id}-${Date.now()}`,
      menuItemId: item.id,
      restaurantId,
      name,
      price,
    });
  }

  return (
    <div className="bg-white rounded-2xl border border-[#2B1410]/8 overflow-hidden">
      <div className="relative aspect-square bg-[#2B1410]/5">
        {item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.imageUrl} alt={name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#2B1410]/20 font-serif text-3xl">
            {name.charAt(0)}
          </div>
        )}

        {!isAvailable && (
          <div className="absolute inset-0 bg-[#FDF6EC]/70 flex items-center justify-center">
            <span className="text-[11px] font-medium text-[#2B1410]/60 bg-white px-2 py-1 rounded-full">
              Unavailable
            </span>
          </div>
        )}

        {/* Add / quantity control, overlapping bottom-right of image */}
        {isAvailable && (
          quantity > 0 ? (
            <div className="absolute -bottom-3 right-3 flex items-center gap-1.5 bg-[#2B1410] text-[#FDF6EC] rounded-full px-1 py-1 shadow-md">
              <button
                onClick={() => removeOneOrAll(item.id)}
                className="w-6 h-6 flex items-center justify-center"
                aria-label="Remove one"
              >
                <Minus size={12} />
              </button>
              <span className="text-xs font-mono w-4 text-center">{quantity}</span>
              <button
                onClick={handleAddClick}
                className="w-6 h-6 flex items-center justify-center"
                aria-label="Add one more"
              >
                <Plus size={12} />
              </button>
            </div>
          ) : (
            <button
              onClick={handleAddClick}
              className="absolute -bottom-3 right-3 w-8 h-8 rounded-full bg-[#C0392B] text-[#FDF6EC] flex items-center justify-center shadow-md hover:bg-[#A8301F] active:scale-95 transition-all"
              aria-label={item.hasModifiers ? "Customize" : "Add"}
            >
              <Plus size={16} />
            </button>
          )
        )}
      </div>

      <div className="p-3 pt-4">
        <h4 className="text-sm font-medium text-[#2B1410] truncate">{name}</h4>
        <p className="text-sm font-mono text-[#2B1410]/70 mt-0.5">
          {item.hasModifiers ? "From " : ""}Rs {price}
        </p>
      </div>
    </div>
  );
}