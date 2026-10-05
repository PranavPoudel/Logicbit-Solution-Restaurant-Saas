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
  const displayName =
    customer?.fullName || (customer as { name?: string } | null)?.name || customer?.email || "";
  const firstName = displayName.split(" ")[0];
  const initial = (displayName.trim()[0] ?? "?").toUpperCase();

  function handleLogout() {
    setMenuOpen(false);
    logout();
    router.push("/");
  }

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-brand-dark/8 shadow-sm">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 h-[72px] flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-full bg-brand-primary flex items-center justify-center">
            <span className="font-serif font-bold text-brand-background text-sm">L</span>
          </div>
          <span className="font-serif text-lg font-semibold text-brand-dark tracking-tight">
            {t("brandName")}
          </span>
        </Link>

        <div className="flex items-center gap-4 lg:gap-7 shrink-0">
          <button
            type="button"
            onClick={() => setSearchOpenPath(searchOpen ? null : pathname)}
            aria-label="Search"
            aria-expanded={searchOpen}
            className={`w-10 h-10 rounded-full border border-brand-dark/10 flex items-center justify-center text-brand-dark hover:bg-brand-dark/5 transition-colors ${searchOpen ? "bg-brand-dark/8" : ""}`}
          >
            <span className="relative block w-4 h-4">
              <Search
                size={16}
                className={`absolute inset-0 transition-all duration-300 ${
                  searchOpen ? "opacity-0 rotate-90 scale-50" : "opacity-100 rotate-0 scale-100"
                }`}
              />
              <X
                size={16}
                className={`absolute inset-0 transition-all duration-300 ${
                  searchOpen ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-50"
                }`}
              />
            </span>
          </button>

          <Link
            href="/for-restaurants"
            className="hidden md:flex items-center gap-1.5 text-sm font-medium text-brand-dark hover:text-brand-primary transition-colors"
          >
            <Store size={16} />
            <span>{t("forRestaurants")}</span>
          </Link>

          {!mounted && <div className="w-24 h-9" aria-hidden />}

          {mounted && !signedIn && (
            <>
              <Link
                href="/login"
                className="hidden sm:inline-flex text-base font-medium text-brand-dark hover:text-brand-primary transition-colors px-3"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="text-base font-medium px-6 py-2.5 rounded-full border border-brand-dark/20 text-brand-dark hover:bg-brand-dark/5 transition-colors"
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
                className="flex items-center gap-2 rounded-full border border-brand-dark/10 pl-1 pr-2.5 py-1 hover:bg-brand-dark/5 transition-colors"
              >
                <span className="w-7 h-7 rounded-full bg-brand-primary text-brand-background text-xs font-bold flex items-center justify-center">
                  {initial}
                </span>
                <span className="hidden sm:inline text-sm font-medium text-brand-dark max-w-[96px] truncate">
                  {firstName}
                </span>
                <ChevronDown size={14} className={`text-brand-dark/60 transition-transform ${menuOpen ? "rotate-180" : ""}`} />
              </button>

              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-56 rounded-xl border border-brand-dark/10 bg-white shadow-lg py-1.5 z-40"
                >
                  <div className="px-3.5 py-2 border-b border-brand-dark/8">
                    <p className="text-sm font-semibold text-brand-dark truncate">{displayName}</p>
                    {customer?.email && (
                      <p className="text-xs text-brand-dark/50 truncate">{customer.email}</p>
                    )}
                  </div>
                  <Link
                    href="/account"
                    role="menuitem"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3.5 py-2 text-sm text-brand-dark hover:bg-brand-dark/5"
                  >
                    <User size={15} /> My account
                  </Link>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-red-600 hover:bg-red-50 border-t border-brand-dark/8 mt-1.5"
                  >
                    <LogOut size={15} /> Log out
                  </button>
                </div>
              )}
            </div>
          )}

          {signedIn && (
            <Link
              href="/cart"
              className="relative flex items-center gap-2 bg-brand-dark text-brand-background text-sm font-medium px-4 py-2 rounded-full hover:bg-brand-dark-hover transition-colors"
            >
              <ShoppingBag size={16} />
              <span className="hidden sm:inline">{t("cart")}</span>

              {mounted && itemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-brand-primary text-brand-background text-[11px] font-mono font-bold flex items-center justify-center">
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
