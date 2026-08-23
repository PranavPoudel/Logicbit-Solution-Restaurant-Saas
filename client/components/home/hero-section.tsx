// components/home/hero-section.tsx
"use client";

import { Search, MapPin } from "lucide-react";

export function HeroSection() {
  return (
    <div className="relative overflow-hidden bg-[#17181C]">
      {/* decorative gradient + soft shapes instead of a stock photo — keeps
          the hero from depending on an external image that could break */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#17181C] via-[#1F2128] to-[#0F6B5C]/40" />
      <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-[#E3A008]/20 blur-3xl" />
      <div className="absolute -bottom-32 -left-16 w-80 h-80 rounded-full bg-[#0F6B5C]/25 blur-3xl" />

      <div className="relative max-w-6xl mx-auto px-4 pt-14 pb-20 sm:pt-20 sm:pb-28 text-center">
        <span className="inline-block font-mono text-[11px] uppercase tracking-[0.15em] text-[#E3A008] mb-4">
          Kirtipur, Kathmandu
        </span>
        <h1 className="font-display font-semibold text-white text-3xl sm:text-5xl leading-tight max-w-2xl mx-auto">
          Find restaurants that deliver near you
        </h1>
        <p className="text-white/60 text-sm sm:text-base mt-3 max-w-md mx-auto">
          Hundreds of restaurants, one order away — fast delivery across Kathmandu.
        </p>

        {/* floating search card, reference-style */}
        <div className="mt-8 max-w-xl mx-auto bg-white rounded-2xl p-2 flex flex-col sm:flex-row gap-2 shadow-2xl shadow-black/30">
          <div className="flex items-center gap-2 flex-1 px-3 py-2.5">
            <Search size={17} className="text-neutral-400 shrink-0" />
            <input
              type="text"
              placeholder="Search restaurants or dishes"
              className="w-full text-sm text-[#17181C] placeholder:text-neutral-400 focus:outline-none"
            />
          </div>
          <div className="hidden sm:flex items-center gap-2 px-3 py-2.5 border-l border-neutral-100">
            <MapPin size={15} className="text-[#E3A008] shrink-0" />
            <span className="text-sm text-neutral-500 whitespace-nowrap">Kirtipur</span>
          </div>
          <button className="bg-[#17181C] text-white text-sm font-medium px-6 py-2.5 rounded-xl shrink-0">
            Search
          </button>
        </div>
      </div>
    </div>
  );
}
