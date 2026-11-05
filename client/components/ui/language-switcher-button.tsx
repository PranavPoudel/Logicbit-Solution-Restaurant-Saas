// components/ui/language-switcher-button.tsx
"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";

const OTHER: Record<string, { code: string; label: string }> = {
  en: { code: "ja", label: "日本語" },
  ja: { code: "en", label: "English" },
};

export function LanguageSwitcherButton({ className = "" }: { className?: string }) {
  const locale = useLocale();
  const t = useTranslations("header");
  const router = useRouter();
  const pathname = usePathname();
  const other = OTHER[locale] ?? OTHER.en;

  return (
    <button
      type="button"
      lang={other.code}
      aria-label={t("switchLanguage", { language: other.label })}
      onClick={() => router.replace(pathname.replace(`/${locale}`, `/${other.code}`) + window.location.search)}
      className={`min-h-11 shrink-0 items-center justify-center rounded-full border-2 border-ink/20 px-4 font-bold hover:border-ink ${className}`}
    >
      {other.label}
    </button>
  );
}
