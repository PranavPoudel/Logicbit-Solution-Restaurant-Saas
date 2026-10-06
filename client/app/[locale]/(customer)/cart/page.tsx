"use client";

import Link from "next/link"; 
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCartStore } from "@/store/cart-store";

export default function CartPage() {
  const t = useTranslations("cart");
  const { items, subtotal, addItem, removeOneOrAll, removeItem } = useCartStore();
  const sub = subtotal();

  if (items.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <ShoppingBag className="mx-auto text-neutral-300 mb-4" size={48} />
        <h1 className="font-display font-semibold text-xl text-[#17181C]">{t("emptyTitle")}</h1>
        <p className="text-sm text-neutral-500 mt-1.5 mb-6">{t("emptyDesc")}</p>
        <Link
          href="/"
          className="inline-block bg-[#17181C] text-white text-sm font-medium px-6 py-2.5 rounded-full hover:bg-[#2B2D33] transition-colors"
        >
          {t("browseRestaurants")}
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <h1 className="font-display font-semibold text-xl text-[#17181C] mb-5">{t("title")}</h1>

      <div className="bg-white border border-[#E8E7E2] rounded-2xl divide-y divide-[#E8E7E2]">
        {items.map((item) => (
          <div key={`${item.menuItemId}-${item.variantKey}`} className="p-4 flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#17181C] truncate">{item.name}</p>
              {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  {item.selectedModifiers.map(m => m.optionName).join(", ")}
                </p>
              )}
              <p className="text-xs text-neutral-500 mt-1 font-mono">Rs {item.price}</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center border border-[#E8E7E2] rounded-full bg-[#FAFAF7]">
                <button
                  aria-label={`Remove one ${item.name}`}
                  onClick={() => removeOneOrAll(item.menuItemId, item.variantKey)}
                  className="p-1.5 text-neutral-600 hover:text-[#17181C] transition-colors"
                >
                  <Minus size={14} />
                </button>
                <span className="w-6 text-center text-sm font-medium text-[#17181C]">{item.quantity}</span>
                <button
                  aria-label={`Add one ${item.name}`}
                  onClick={() =>
                    addItem({
                      id: item.id,
                      menuItemId: item.menuItemId,
                      restaurantId: item.restaurantId,
                      name: item.name,
                      price: item.price,
                      selectedModifiers: item.selectedModifiers,
                      variantKey: item.variantKey,
                      quantity: 1,
                    })
                  }
                  className="p-1.5 text-neutral-600 hover:text-[#17181C] transition-colors"
                >
                  <Plus size={14} />
                </button>
              </div>

              <p className="text-sm font-semibold text-[#17181C] font-mono w-16 text-right">
                Rs {item.price * item.quantity}
              </p>

              <button
                aria-label={`Remove ${item.name} from cart`}
                onClick={() => removeItem(item.menuItemId, item.variantKey)}
                className="p-1.5 text-neutral-400 hover:text-red-600 transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white border border-[#E8E7E2] rounded-2xl p-4 mt-4 space-y-2 text-sm">
        <div className="flex justify-between text-neutral-500">
          <span>{t("subtotal")}</span>
          <span className="font-mono">Rs {sub}</span>
        </div>
        <div className="flex justify-between text-neutral-500">
          <span>{t("deliveryFee")}</span>
          <span className="text-xs text-neutral-400 italic">{t("calculatedAtCheckout")}</span>
        </div>
        <div className="flex justify-between font-semibold text-[#17181C] pt-2 border-t border-[#E8E7E2]">
          <span>{t("baseTotal")}</span>
          <span className="font-mono">Rs {sub}</span>
        </div>
      </div>

      <Link
        href="/checkout" // ✅ next-intl middleware automatically prefixes this with /en or /ja
        className="block w-full mt-5 bg-[#17181C] text-white text-sm font-medium py-3.5 rounded-2xl text-center hover:bg-[#2B2D33] transition-colors"
      >
        {t("proceedToCheckout")} — Rs {sub}
      </Link>
    </div>
  );
}