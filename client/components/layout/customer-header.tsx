"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { ShoppingBag, Store, Search, User, LogOut, ChevronDown, X } from "lucide-react";
import { useCartStore } from "@/store/cart-store";
import { useCustomerAuthStore } from "@/store/customer-auth-store";
import { HeaderSearchPanel } from "@/components/layout/header-search-panel";
import { useIsMounted } from "@/hooks/use-is-mounted";
import { useEscapeKey } from "@/hooks/use-escape-key";

export function CustomerHeader() {
  const t = useTranslations("header");
  const router = useRouter();
  const itemCount = useCartStore((s) => s.itemCount());
  const customer = useCustomerAuthStore((s) => s.customer);
  const isAuthenticated = useCustomerAuthStore((s) => s.isAuthenticated);
  const logout = useCustomerAuthStore((s) => s.logout);

  const mounted = useIsMounted();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const pathname = usePathname();
  const [searchOpenPath, setSearchOpenPath] = useState<string | null>(null);
  const searchOpen = searchOpenPath === pathname;
  const closeSearch = () => setSearchOpenPath(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [menuOpen]);

  useEscapeKey(() => setMenuOpen(false), menuOpen);

  const signedIn = mounted && isAuthenticated && !!customer;
  const displayName = customer?.name || customer?.email || "";
  const firstName = displayName.split(" ")[0];
  const initial = (displayName.trim()[0] ?? "?").toUpperCase();

  function handleLogout() {
    setMenuOpen(false);
    logout();
    router.push("/");
  }

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-brand-dark/8 shadow-sm">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 h-20 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3 shrink-0 min-h-[48px]">
          <div className="w-11 h-11 rounded-full bg-brand-primary flex items-center justify-center">
            <span className="font-serif font-bold text-brand-background text-lg">L</span>
          </div>
          <span className="font-serif text-2xl font-semibold text-brand-dark tracking-tight">
            {t("brandName")}
          </span>
        </Link>

        <div className="flex items-center gap-3 lg:gap-5 shrink-0">
          {/* Search: icon + label, bigger target */}
          <button
            type="button"
            onClick={() => setSearchOpenPath(searchOpen ? null : pathname)}
            aria-label="Search"
            aria-expanded={searchOpen}
            className={`min-h-[48px] min-w-[48px] px-3 sm:px-4 rounded-full border-2 border-brand-dark/15 flex items-center justify-center gap-2 text-brand-dark font-medium hover:bg-brand-dark/5 hover:border-brand-dark/30 transition-colors ${searchOpen ? "bg-brand-dark/10 border-brand-dark/30" : ""}`}
          >
            <span className="relative block w-6 h-6">
              <Search
                size={24}
                className={`absolute inset-0 transition-all duration-300 ${
                  searchOpen ? "opacity-0 rotate-90 scale-50" : "opacity-100 rotate-0 scale-100"
                }`}
              />
              <X
                size={24}
                className={`absolute inset-0 transition-all duration-300 ${
                  searchOpen ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-50"
                }`}
              />
            </span>
            <span className="hidden sm:inline text-base">{searchOpen ? "Close" : "Search"}</span>
          </button>

          <Link
            href="/for-restaurants"
            className="hidden md:flex items-center gap-2 min-h-[48px] px-3 rounded-full text-base font-medium text-brand-dark hover:text-brand-primary hover:bg-brand-primary/5 transition-colors"
          >
            <Store size={24} />
            <span>{t("forRestaurants")}</span>
          </Link>

          {!mounted && <div className="w-24 h-12" aria-hidden />}

          {mounted && !signedIn && (
            <>
              <Link
                href="/login"
                className="hidden sm:inline-flex items-center min-h-[48px] text-base font-medium text-brand-dark hover:text-brand-primary transition-colors px-4"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center min-h-[48px] text-base font-semibold px-6 rounded-full bg-brand-primary text-brand-background hover:bg-brand-primary-hover transition-colors"
              >
                Sign up
              </Link>
            </>
          )}

          {signedIn && (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                className="flex items-center gap-2.5 min-h-[48px] rounded-full border-2 border-brand-dark/15 pl-1.5 pr-3 py-1 hover:bg-brand-dark/5 hover:border-brand-dark/30 transition-colors"
              >
                <span className="w-9 h-9 rounded-full bg-brand-primary text-brand-background text-base font-bold flex items-center justify-center">
                  {initial}
                </span>
                <span className="hidden sm:inline text-base font-medium text-brand-dark max-w-[120px] truncate">
                  {firstName}
                </span>
                <ChevronDown size={20} className={`text-brand-dark/60 transition-transform ${menuOpen ? "rotate-180" : ""}`} />
              </button>

              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-64 rounded-xl border border-brand-dark/10 bg-white shadow-lg py-2 z-40"
                >
                  <div className="px-4 py-3 border-b border-brand-dark/8">
                    <p className="text-base font-semibold text-brand-dark truncate">{displayName}</p>
                    {customer?.email && (
                      <p className="text-sm text-brand-dark/60 truncate">{customer.email}</p>
                    )}
                  </div>
                  <Link
                    href="/account"
                    role="menuitem"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-4 min-h-[48px] text-base text-brand-dark hover:bg-brand-dark/5"
                  >
                    <User size={22} /> My account
                  </Link>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 min-h-[48px] text-base text-red-600 hover:bg-red-50 border-t border-brand-dark/8 mt-1.5"
                  >
                    <LogOut size={22} /> Log out
                  </button>
                </div>
              )}
            </div>
          )}

          {signedIn && (
            <Link
              href="/cart"
              className="relative flex items-center gap-2.5 min-h-[48px] bg-brand-dark text-brand-background text-base font-semibold px-5 rounded-full hover:bg-brand-dark-hover transition-colors"
            >
              <ShoppingBag size={24} />
              <span className="hidden sm:inline">{t("cart")}</span>

              {mounted && itemCount > 0 && (
                <span className="absolute -top-2 -right-2 min-w-[26px] h-[26px] px-1 rounded-full bg-brand-primary text-brand-background text-sm font-mono font-bold flex items-center justify-center ring-2 ring-white">
                  {itemCount}
                </span>
              )}
            </Link>
          )}
        </div>
      </div>

      <HeaderSearchPanel open={searchOpen} onClose={closeSearch} />
    </header>
  );
}