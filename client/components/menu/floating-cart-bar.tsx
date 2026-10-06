// components/menu/floating-cart-bar.tsx
"use client";

import Link from "next/link";
import { useCartStore } from "@/store/cart-store";

export function FloatingCartBar({ sidebarCart = false }: { sidebarCart?: boolean }) {
  const itemCount = useCartStore((s) => s.itemCount());
  const subtotal = useCartStore((s) => s.subtotal());

  if (itemCount === 0) return null;

  return (
    <div className={`fixed bottom-4 left-0 right-0 z-30 px-4 ${sidebarCart ? "lg:hidden" : ""}`}>
      <Link
        href="/cart"
        className="max-w-4xl mx-auto flex items-center justify-between bg-[#2B1410] text-[#FDF6EC] rounded-2xl px-5 py-4 shadow-xl shadow-[#2B1410]/30"
      >
        <span className="text-sm font-medium">
          {itemCount} {itemCount === 1 ? "item" : "items"}
        </span>
        <span className="text-sm font-semibold flex items-center gap-1.5">
          View cart
          <span className="font-mono">Rs {subtotal}</span>
        </span>
      </Link>
    </div>
  );
}