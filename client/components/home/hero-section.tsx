// components/home/hero-section.tsx
"use client";

import { Search, MapPin } from "lucide-react";

export function HeroSection() {
  return (
    <div className="relative overflow-hidden bg-[#17181C] rounded-b-[2.5rem]">
      {/* decorative gradient + soft shapes instead of a stock photo — keeps
          the hero from depending on an external image that could break */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#17181C] via-[#1F2128] to-[#0F6B5C]/40" />
      <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-[#E3A008]/20 blur-3xl" />
      <div className="absolute -bottom-32 -left-16 w-80 h-80 rounded-full bg-[#0F6B5C]/25 blur-3xl" />

      <div className="relative max-w-6xl mx-auto px-4 pt-14 pb-20 sm:pt-20 sm:pb-28 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
        <span className="inline-block font-mono text-[11px] uppercase tracking-[0.15em] text-[#E3A008] mb-5">
          Kirtipur, Kathmandu
        </span>
        <h1 className="font-display font-semibold text-white text-3xl sm:text-5xl leading-tight max-w-2xl mx-auto">
          Find restaurants that deliver near you
        </h1>
        <p className="text-white/60 text-sm sm:text-base mt-3 max-w-md mx-auto">
          Hundreds of restaurants, one order away — fast delivery across Kathmandu.
        </p>

        {/* trust stats row */}
        <div className="flex items-center justify-center gap-3 sm:gap-5 mt-5 text-white/50 text-xs sm:text-sm">
          <span>500+ Restaurants</span>
          <span className="w-1 h-1 rounded-full bg-white/30" />
          <span>30 Min Delivery</span>
          <span className="w-1 h-1 rounded-full bg-white/30" />
          <span>Free Delivery Over Rs. 999</span>
        </div>

        {/* floating search card, reference-style */}
        <div className="mt-8 max-w-xl mx-auto bg-white rounded-2xl p-2 flex flex-col sm:flex-row gap-2 shadow-2xl shadow-black/30">
          <div className="flex items-center gap-2 flex-1 px-3 py-2.5">
            <Search size={17} className="text-neutral-400 shrink-0" />
            <input
              type="text"
              placeholder="Search restaurants or dishes"
              className="w-full text-sm text-[#17181C] placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#E3A008]/40 rounded-lg"
            />
          </div>
          <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-neutral-50 rounded-xl">
            <MapPin size={15} className="text-[#E3A008] shrink-0" />
            <span className="text-sm text-neutral-500 whitespace-nowrap">Kirtipur</span>
          </div>
          <button className="bg-[#17181C] text-white text-sm font-medium px-6 py-2.5 rounded-2xl shrink-0 hover:bg-[#0F6B5C] transition-colors">
            Search
          </button>
        </div>
      </div>
    </div>
  );
}