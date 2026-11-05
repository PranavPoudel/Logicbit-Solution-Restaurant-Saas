// components/layout/customer-header.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCartStore } from "@/store/cart-store";
import { useSoundMuted } from "@/store/sound-store";
import { useCustomerAuthStore } from "@/store/customer-auth-store";
import { useIsMounted } from "@/hooks/use-is-mounted";
import { useTranslations } from "next-intl";
import { theme } from "@/config/theme";
import { Button, Icon, IconButton } from "@/components/ui/primitives";
import { LanguageSwitcherButton } from "@/components/ui/language-switcher-button";
import { useCustomerTheme } from "@/components/layout/customer-shell";

export function Logo() {
  const t = useTranslations("header");
  const [first, second] = theme.brand.name.split(/(?=[A-Z])/);
  return (
    <Link href="/" className="font-display flex min-h-11 items-center text-3xl font-extrabold tracking-tight" aria-label={t("home", { brand: theme.brand.name })}>
      {first}<span className="text-chili">{second}</span>
      <span className="text-saffron">.</span>
    </Link>
  );
}

const LINKS = [
  { href: "/restaurants", key: "restaurants", icon: "store" },
  { href: "/account?tab=orders", key: "myOrders", icon: "bag" },
  { href: "/for-restaurants", key: "forRestaurants", icon: "flame" },
] as const;

export function CustomerHeader() {
  const t = useTranslations("header");
  const router = useRouter();
  const pathname = usePathname();
  const mounted = useIsMounted();
  const { dark, setDark } = useCustomerTheme();
  const [muted, setMuted] = useSoundMuted();
  const [menuOpen, setMenuOpen] = useState(false);
  const count = useCartStore((s) => s.itemCount());
  const customer = useCustomerAuthStore((s) => s.customer);
  const isAuthenticated = useCustomerAuthStore((s) => s.isAuthenticated);
  const logout = useCustomerAuthStore((s) => s.logout);
  const signedIn = mounted && isAuthenticated;
  const firstName = customer?.name?.split(" ")[0] ?? t("account");
  const closeMenu = () => setMenuOpen(false);
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen]);
  const signOut = () => {
    closeMenu();
    logout();
    router.push("/");
  };

  return (
    <header className="relative z-30 mx-auto flex w-full max-w-[1440px] items-center justify-between gap-3 px-5 py-4 md:px-10">
      <Logo />
      <nav className="hidden items-center gap-5 whitespace-nowrap font-medium md:flex lg:gap-8" aria-label={t("main")}>
        {LINKS.map((l) => (
          <Link key={l.href} href={l.href} className={`hover:text-chili ${!l.href.includes("?") && pathname.endsWith(l.href) ? "text-chili" : ""}`}>
            {t(l.key)}
          </Link>
        ))}
      </nav>
      <div className="flex items-center gap-2">
        <LanguageSwitcherButton className="hidden md:flex" />
        <IconButton
          icon={muted ? "volumeOff" : "volume"}
          label={muted ? t("unmuteSounds") : t("muteSounds")}
          onClick={() => setMuted(!muted)}
          className="hidden border-2 border-ink/20 hover:border-ink md:grid"
        />
        <IconButton
          icon={dark ? "sun" : "moon"}
          label={dark ? t("switchToLight") : t("switchToDark")}
          onClick={() => setDark(!dark)}
          className="border-2 border-ink/20 hover:border-ink"
        />
        {signedIn ? (
          <>
            <Link href="/account" className="hidden min-h-11 items-center gap-2 rounded-full border-2 border-ink/20 px-4 font-bold hover:border-ink md:flex">
              <Icon name="user" className="h-5 w-5" />
              <span className="hidden lg:inline">{firstName}</span>
            </Link>
            <IconButton icon="logout" label={t("logOut")} onClick={signOut} className="hidden border-2 border-ink/20 hover:border-ink md:grid" />
          </>
        ) : (
          <Link href="/login" className="hidden min-h-11 items-center gap-2 rounded-full border-2 border-ink/20 px-4 font-bold hover:border-ink md:flex">
            <Icon name="user" className="h-5 w-5" />
            <span className="hidden lg:inline">{t("logIn")}</span>
          </Link>
        )}
        <Button
          variant="ink"
          onClick={() => {
            closeMenu();
            router.push("/cart");
          }} aria-label={t("cartCount", { count: mounted ? count : 0 })}>
          <Icon name="bag" />
          {mounted ? count : 0}
        </Button>
        <IconButton
          icon={menuOpen ? "x" : "menu"}
          label={menuOpen ? t("closeMenu") : t("openMenu")}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          onClick={() => setMenuOpen(!menuOpen)}
          className="border-2 border-ink/20 hover:border-ink md:hidden"
        />
      </div>

      {menuOpen && (
        <nav id="mobile-menu" aria-label={t("menu")} className="animate-fade-up absolute inset-x-4 top-full rounded-[28px] bg-paper p-3 shadow-warm md:hidden">
          <ul className="space-y-1">
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} onClick={closeMenu} className="flex min-h-12 items-center gap-3 rounded-full px-4 text-lg font-bold hover:bg-ink/10">
                  <Icon name={l.icon} className="h-5 w-5 text-chili" />
                  {t(l.key)}
                </Link>
              </li>
            ))}
            <li>
              {signedIn ? (
                <Link href="/account" onClick={closeMenu} className="flex min-h-12 items-center gap-3 rounded-full px-4 text-lg font-bold hover:bg-ink/10">
                  <Icon name="user" className="h-5 w-5 text-chili" />
                  {t("accountOf", { name: firstName })}
                </Link>
              ) : (
                <Link href="/login" onClick={closeMenu} className="flex min-h-12 items-center gap-3 rounded-full px-4 text-lg font-bold hover:bg-ink/10">
                  <Icon name="user" className="h-5 w-5 text-chili" />
                  {t("logIn")}
                </Link>
              )}
            </li>
            <li>
              <button type="button" onClick={() => setMuted(!muted)} className="flex min-h-12 w-full items-center gap-3 rounded-full px-4 text-lg font-bold hover:bg-ink/10">
                <Icon name={muted ? "volumeOff" : "volume"} className="h-5 w-5 text-chili" />
                {muted ? t("unmuteSounds") : t("muteSounds")}
              </button>
            </li>
          </ul>
          <div className="mt-2 flex gap-2 border-t-2 border-ink/10 pt-3">
            <LanguageSwitcherButton className="flex flex-1" />
            {signedIn && (
              <Button variant="outline" onClick={signOut} className="flex-1">
                <Icon name="logout" className="h-5 w-5" />{t("logOut")}
              </Button>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
