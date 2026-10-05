"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, Minus, Plus } from "lucide-react";
import { useCartStore } from "@/store/cart-store";
import { useIsMounted } from "@/hooks/use-is-mounted";

export function CartSummaryCard() {
  const items = useCartStore((s) => s.items);
  const itemCount = useCartStore((s) => s.itemCount());
  const subtotal = useCartStore((s) => s.subtotal());
  const addItem = useCartStore((s) => s.addItem);
  const removeOneOrAll = useCartStore((s) => s.removeOneOrAll);

  const [open, setOpen] = useState(false);
  const mounted = useIsMounted();

  if (!mounted || itemCount === 0) return null;

  return (
    <div className="animate-fade-up rounded-2xl bg-brand-dark text-brand-background shadow-xl shadow-brand-dark/30">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
      >
        <span className="text-sm font-medium">{itemCount} {itemCount === 1 ? "item" : "items"}</span>
        <span className="text-sm font-semibold flex items-center gap-1.5">
          View cart
          <span className="font-mono">Rs {subtotal}</span>
          <ChevronDown
            size={16}
            className={`ml-1 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
          />
        </span>
      </button>

      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="border-t border-brand-background/15 px-5 pt-2 pb-5">
            <ul className="max-h-72 overflow-y-auto divide-y divide-brand-background/10">
              {items.map((item) => (
                <li
                  key={`${item.menuItemId}::${item.variantKey}`}
                  className="flex items-center gap-3 py-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.name}</p>
                    {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                      <p className="text-[11px] text-brand-background/60 truncate">
                        {item.selectedModifiers.map((m) => m.optionName).join(", ")}
                      </p>
                    )}
                    <p className="font-mono text-xs text-brand-background/60 mt-0.5">Rs {item.price}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => removeOneOrAll(item.menuItemId, item.variantKey)}
                      aria-label={`Remove one ${item.name}`}
                      className="w-7 h-7 rounded-full border border-brand-background/25 flex items-center justify-center hover:bg-brand-background/10"
                    >
                      <Minus size={13} />
                    </button>
                    <span className="w-5 text-center font-mono text-sm">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() =>
                        addItem({
                          id: item.id,
                          menuItemId: item.menuItemId,
                          restaurantId: item.restaurantId,
                          name: item.name,
                          price: item.price,
                          selectedModifiers: item.selectedModifiers,
                          variantKey: item.variantKey,
                        })
                      }
                      aria-label={`Add one more ${item.name}`}
                      className="w-7 h-7 rounded-full border border-brand-background/25 flex items-center justify-center hover:bg-brand-background/10"
                    >
                      <Plus size={13} />
                    </button>
                  </div>

                  <span className="w-16 text-right font-mono text-sm font-semibold shrink-0">
                    Rs {item.price * item.quantity}
                  </span>
                </li>
              ))}
            </ul>

            <div className="flex items-center justify-between mt-3 pt-3 border-t border-brand-background/15 text-sm">
              <span className="text-brand-background/70">Subtotal</span>
              <span className="font-mono font-semibold">Rs {subtotal}</span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <Link
                href="/cart"
                className="text-center rounded-xl border border-brand-background/25 py-2.5 text-sm font-medium hover:bg-brand-background/10 transition-colors"
              >
                View cart
              </Link>
              <Link
                href="/checkout"
                className="text-center rounded-xl bg-brand-background py-2.5 text-sm font-semibold text-brand-dark hover:bg-white transition-colors"
              >
                Checkout
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
