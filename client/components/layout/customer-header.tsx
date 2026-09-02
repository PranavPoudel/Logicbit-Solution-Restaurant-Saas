"use client";

import Link from "next/link";
import { MapPin, ShoppingBag, ChevronDown, User, Store } from "lucide-react";
import { useCartStore } from "@/store/cart-store";

export function CustomerHeader() {
  const itemCount = useCartStore((s) => s.itemCount());

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-[#2B1410]/8 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-full bg-[#C0392B] flex items-center justify-center">
            <span className="font-serif font-bold text-[#FDF6EC] text-sm">L</span>
          </div>
          <span className="font-serif text-lg font-semibold text-[#2B1410] tracking-tight">
            LogicBit
          </span>
        </Link>

        <button className="hidden sm:flex items-center gap-1.5 text-sm text-[#2B1410] hover:bg-[#2B1410]/5 px-3 py-1.5 rounded-full border border-[#2B1410]/10 transition-colors">
          <MapPin size={14} className="text-[#C0392B]" />
          Kirtipur, Kathmandu
          <ChevronDown size={13} className="text-[#2B1410]/40" />
        </button>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/owner/register"
            className="hidden md:flex items-center gap-1.5 text-sm font-medium text-[#2B1410] hover:text-[#C0392B] transition-colors"
          >
            <Store size={16} />
            <span>For Restaurants</span>
          </Link>

          <Link
            href="/account"
            className="w-9 h-9 rounded-full border border-[#2B1410]/10 flex items-center justify-center text-[#2B1410] hover:bg-[#2B1410]/5 transition-colors"
            aria-label="Account"
          >
            <User size={16} />
          </Link>

          <Link
            href="/cart"
            className="relative flex items-center gap-2 bg-[#2B1410] text-[#FDF6EC] text-sm font-medium px-4 py-2 rounded-full hover:bg-[#3D1E17] transition-colors"
          >
            <ShoppingBag size={16} />
            <span className="hidden sm:inline">Cart</span>
            {itemCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#C0392B] text-[#FDF6EC] text-[11px] font-mono font-bold flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}