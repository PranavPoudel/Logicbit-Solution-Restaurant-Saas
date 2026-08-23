// components/layout/customer-header.tsx
"use client";

import Link from "next/link";
import { MapPin, ShoppingBag, ChevronDown, User } from "lucide-react";
import { useCartStore } from "@/store/cart-store";

export function CustomerHeader() {
  const itemCount = useCartStore((s) => s.itemCount());

  return (
    <header className="sticky top-0 z-30 bg-[#FAFAF7]/95 backdrop-blur border-b border-[#E8E7E2]">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-[#17181C] flex items-center justify-center">
            <span className="font-mono text-[#E3A008] text-sm font-bold">L</span>
          </div>
          <span className="font-display text-lg font-semibold text-[#17181C] tracking-tight">
            LogicBit
          </span>
        </Link>

        <button className="hidden sm:flex items-center gap-1.5 text-sm text-[#17181C] hover:bg-black/5 px-3 py-1.5 rounded-full border border-[#E8E7E2]">
          <MapPin size={14} className="text-[#E3A008]" />
          Kirtipur, Kathmandu
          <ChevronDown size={13} className="text-neutral-400" />
        </button>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/account"
            className="w-9 h-9 rounded-full border border-[#E8E7E2] flex items-center justify-center text-[#17181C] hover:bg-black/5"
            aria-label="Account"
          >
            <User size={16} />
          </Link>

          <Link
            href="/cart"
            className="relative flex items-center gap-2 bg-[#17181C] text-white text-sm font-medium px-4 py-2 rounded-full"
          >
            <ShoppingBag size={16} />
            <span className="hidden sm:inline">Cart</span>
            {itemCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#E3A008] text-[#17181C] text-[11px] font-mono font-bold flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
