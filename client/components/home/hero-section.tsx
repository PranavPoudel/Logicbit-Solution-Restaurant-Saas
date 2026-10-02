// components/home/hero-section.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { theme } from "@/config/theme";

export function HeroSection() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
  };

  return (
    <div className="relative overflow-hidden rounded-b-[2.5rem] min-h-[520px]">
      {/* background images now come from theme.brand.heroImages */}
      <div className="absolute inset-0 flex">
        {theme.brand.heroImages.map((src, i) => (
          <div key={i} className="flex-1 relative">
            <img src={src} alt="" className="w-full h-full object-cover" />
          </div>
        ))}
      </div>

      {/* overlay uses theme.colors.background */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: `${theme.colors.background}A6` /* ~65% opacity */ }}
      />

      <div className="relative max-w-6xl mx-auto px-5 pt-16 pb-20 sm:pt-24 sm:pb-28 text-center">
        <h1
          className="font-serif text-5xl sm:text-7xl leading-[1.05] max-w-2xl mx-auto"
          style={{ color: theme.colors.dark }}
        >
          {theme.content.heroHeadingPlain}{" "}
          <span className="italic" style={{ color: theme.colors.primary }}>
            {theme.content.heroHeadingEmphasis}
          </span>
          {theme.content.heroHeadingSuffix}
        </h1>

        <p
          className="text-base sm:text-lg mt-6 max-w-md mx-auto font-light"
          style={{ color: `${theme.colors.dark}8C` /* ~55% opacity */ }}
        >
          {theme.content.heroSubtext}
        </p>

        {/* search bar */}
        <form
          onSubmit={handleSearch}
          className="mt-8 max-w-md mx-auto bg-white rounded-full p-1.5 flex items-center gap-2 shadow-lg"
          style={{
            boxShadow: `0 10px 25px -5px ${theme.colors.dark}0D`,
            border: `1px solid ${theme.colors.dark}14`,
          }}
        >
          <div className="flex items-center gap-2 flex-1 px-4 py-2">
            <Search size={16} style={{ color: `${theme.colors.dark}59` }} className="shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={theme.content.searchPlaceholder}
              className="w-full bg-transparent text-sm focus:outline-none"
              style={{ color: theme.colors.dark }}
            />
          </div>
          <button
            type="submit"
            className="text-sm font-medium px-6 py-2.5 rounded-full shrink-0 active:scale-95 transition-all duration-200"
            style={{ backgroundColor: theme.colors.dark, color: theme.colors.background }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = theme.colors.darkHover)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = theme.colors.dark)}
          >
            Search
          </button>
        </form>

        <p className="text-xs mt-4" style={{ color: `${theme.colors.dark}66` }}>
          {theme.content.freeDeliveryNote}
        </p>
      </div>
    </div>
  );
}