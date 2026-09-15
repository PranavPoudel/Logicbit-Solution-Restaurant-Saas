"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import { ChevronUp, ChevronDown } from "lucide-react";

const languages = {
  en: { label: "English", flag: "🇬🇧" },
  ja: { label: "日本語", flag: "🇯🇵" },
  ne: { label: "नेपाली", flag: "🇳🇵" },
  hi: { label: "हिन्दी", flag: "🇮🇳" },
};

export function LanguageSwitcherButton() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const currentLang = languages[locale as keyof typeof languages] || languages.en;

  const handleLanguageChange = (newLocale: string) => {
    // ✅ Manually replace the locale prefix in the pathname
    // e.g., changes "/en/menu" to "/ja/menu"
    const newPathname = pathname.replace(`/${locale}`, `/${newLocale}`);
    router.replace(newPathname);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-white border-2 border-[#8B0000] px-3 py-1.5 rounded shadow hover:shadow-md transition-shadow"
      >
        <span className="text-lg">{currentLang.flag}</span>
        <span className="font-semibold text-[#8B0000] text-sm uppercase">{locale}</span>
        {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute bottom-full right-0 mb-2 bg-white border-2 border-[#8B0000] rounded shadow-lg z-50 min-w-[140px]">
            {Object.entries(languages).map(([code, { label, flag }]) => (
              <button
                key={code}
                onClick={() => handleLanguageChange(code)}
                className={`w-full flex items-center gap-2 px-3 py-2 hover:bg-[#8B0000]/10 transition-colors ${
                  locale === code ? "bg-[#8B0000]/20" : ""
                }`}
              >
                <span className="text-lg">{flag}</span>
                <span className="text-sm font-medium text-[#8B0000]">{label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}