"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ShoppingBag, User, Store, Search } from "lucide-react";
import { useCartStore } from "@/store/cart-store";

export function CustomerHeader() {
  const t = useTranslations('header');
  const itemCount = useCartStore((s) => s.itemCount());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-[#2B1410]/8 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-full bg-[#C0392B] flex items-center justify-center">
            <span className="font-serif font-bold text-[#FDF6EC] text-sm">L</span>
          </div>
          <span className="font-serif text-lg font-semibold text-[#2B1410] tracking-tight">
            {t('brandName')}
          </span>
        </Link>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/search"
            className="w-9 h-9 rounded-full border border-[#2B1410]/10 flex items-center justify-center text-[#2B1410] hover:bg-[#2B1410]/5 transition-colors"
            aria-label="Search"
          >
            <Search size={16} />
          </Link>

          <Link
            href="/for-restaurants"
            className="hidden md:flex items-center gap-1.5 text-sm font-medium text-[#2B1410] hover:text-[#C0392B] transition-colors"
          >
            <Store size={16} />
            <span>{t('forRestaurants')}</span>
          </Link>

          <Link
            href="/account"
            className="w-9 h-9 rounded-full border border-[#2B1410]/10 flex items-center justify-center text-[#2B1410] hover:bg-[#2B1410]/5 transition-colors"
            aria-label={t('account')}
          >
            <User size={16} />
          </Link>

          <Link
            href="/cart"
            className="relative flex items-center gap-2 bg-[#2B1410] text-[#FDF6EC] text-sm font-medium px-4 py-2 rounded-full hover:bg-[#3D1E17] transition-colors"
          >
            <ShoppingBag size={16} />
            <span className="hidden sm:inline">{t('cart')}</span>

            {mounted && itemCount > 0 && (
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