// components/menu/menu-item-row.tsx
"use client";

import { Plus, Minus } from "lucide-react";
import type { MenuItem } from "@/types/menu";
import { useCartStore } from "@/store/cart-store";

export function MenuItemRow({
  item,
  restaurantId,
  onOpenModifiers,
}: {
  item: MenuItem;
  restaurantId: string;
  onOpenModifiers: (menuItemId: string) => void;
}) {
  const { items, addItem, removeOneOrAll } = useCartStore();
  // items without modifiers use variantKey "" — matches simple lookup
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
    <div className="flex items-center gap-3 py-4 border-b border-[#E8E7E2] last:border-0">
      <div className="w-16 h-16 rounded-xl bg-neutral-100 overflow-hidden shrink-0">
        {item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.imageUrl} alt={name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-neutral-300 font-display">
            {name.charAt(0)}
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-[#17181C] truncate">{name}</h4>
        {item.description && (
          <p className="text-xs text-neutral-400 mt-0.5 line-clamp-2">{item.description}</p>
        )}
        <p className="text-sm font-mono text-[#17181C] mt-1">
          {item.hasModifiers ? "From " : ""}Rs {price}
        </p>
      </div>

      {!isAvailable ? (
        <span className="text-[11px] text-neutral-400 shrink-0">Unavailable</span>
      ) : item.hasModifiers ? (
        <button
          onClick={handleAddClick}
          className="shrink-0 text-xs font-medium border border-[#E3A008] text-[#17181C] px-3.5 py-2 rounded-full hover:bg-[#E3A008]/10"
        >
          Customize
        </button>
      ) : quantity > 0 ? (
        <div className="flex items-center gap-2 shrink-0 bg-[#17181C] text-white rounded-full px-1 py-1">
          <button
            onClick={() => removeOneOrAll(item.id)}
            className="w-6 h-6 flex items-center justify-center"
            aria-label="Remove one"
          >
            <Minus size={13} />
          </button>
          <span className="text-xs font-mono w-4 text-center">{quantity}</span>
          <button
            onClick={handleAddClick}
            className="w-6 h-6 flex items-center justify-center"
            aria-label="Add one more"
          >
            <Plus size={13} />
          </button>
        </div>
      ) : (
        <button
          onClick={handleAddClick}
          className="shrink-0 text-xs font-medium border border-[#E3A008] text-[#17181C] px-3.5 py-2 rounded-full hover:bg-[#E3A008]/10"
        >
          Add
        </button>
      )}
    </div>
  );
}
