 // components/menu/menu-item-row.tsx
"use client";

import { Plus, Minus } from "lucide-react";
import type { MenuItem } from "@/types/menu";
import { useCartStore } from "@/store/cart-store";
import { theme } from "@/config/theme";
import { getItemImage } from "@/lib/utils/image";
import { AppImage } from "@/components/ui/app-image";

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
    <div
      className="flex items-center gap-3 py-4 last:border-0"
      style={{ borderBottom: `1px solid ${theme.colors.dark}14` }}
    >
      <div
        className="w-16 h-16 rounded-xl overflow-hidden shrink-0"
        style={{ backgroundColor: `${theme.colors.dark}0D` }}
      >
        {getItemImage(item) ? (
          <AppImage sizes="96px" src={getItemImage(item)} alt={name} className="w-full h-full object-cover" />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center font-serif"
            style={{ color: `${theme.colors.dark}40` }}
          >
            {name.charAt(0)}
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium truncate" style={{ color: theme.colors.dark }}>
          {name}
        </h4>
        {item.description && (
          <p className="text-xs mt-0.5 line-clamp-2" style={{ color: `${theme.colors.dark}73` }}>
            {item.description}
          </p>
        )}
        <p className="text-sm font-mono mt-1" style={{ color: theme.colors.dark }}>
          {item.hasModifiers ? theme.content.priceFromPrefix : ""}
          {theme.content.currencyPrefix} {price}
        </p>
      </div>

      {!isAvailable ? (
        <span className="text-[11px] shrink-0" style={{ color: `${theme.colors.dark}66` }}>
          {theme.content.unavailableLabel}
        </span>
      ) : item.hasModifiers ? (
        <button
          onClick={handleAddClick}
          className="shrink-0 text-xs font-medium px-3.5 py-2 rounded-full"
          style={{ border: `1px solid ${theme.colors.primary}`, color: theme.colors.dark }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = `${theme.colors.primary}1A`)}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
        >
          {theme.content.customizeLabel}
        </button>
      ) : quantity > 0 ? (
        <div
          className="flex items-center gap-2 shrink-0 rounded-full px-1 py-1"
          style={{ backgroundColor: theme.colors.dark, color: theme.colors.background }}
        >
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
          className="shrink-0 text-xs font-medium px-3.5 py-2 rounded-full"
          style={{ border: `1px solid ${theme.colors.primary}`, color: theme.colors.dark }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = `${theme.colors.primary}1A`)}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
        >
          {theme.content.addLabel}
        </button>
      )}
    </div>
  );
}