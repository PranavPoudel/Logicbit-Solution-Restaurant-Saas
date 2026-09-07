// components/home/hero-section.tsx
"use client";

import { Search } from "lucide-react";

export function HeroSection() {
  return (
    <div className="relative overflow-hidden rounded-b-[2.5rem] min-h-[520px]">
      {/* 3 vertical images filling the background */}
      <div className="absolute inset-0 flex">
        <div className="flex-1 relative">
          <img src="/images/food-1.avif" alt="" className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 relative">
          <img src="/images/food-2.avif" alt="" className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 relative">
          <img src="/images/food-3.avif" alt="" className="w-full h-full object-cover" />
        </div>
      </div>

      {/* translucent cream overlay so text stays readable on top of the photos */}
      <div className="absolute inset-0 bg-[#FDF6EC]/65" />

      <div className="relative max-w-6xl mx-auto px-5 pt-16 pb-20 sm:pt-24 sm:pb-28 text-center">
        <h1 className="font-serif text-[#2B1410] text-5xl sm:text-7xl leading-[1.05] max-w-2xl mx-auto">
          Order the{" "}
          <span className="italic text-[#C0392B]">good stuff</span>,
          delivered fast.
        </h1>

        <p className="text-[#2B1410]/55 text-base sm:text-lg mt-6 max-w-md mx-auto font-light">
          500+ restaurants across Kathmandu. Fresh, hot, and at your door in 30 minutes.
        </p>

        {/* search — clean, minimal, white on cream */}
        <div className="mt-8 max-w-md mx-auto bg-white rounded-full p-1.5 flex items-center gap-2 shadow-lg shadow-[#2B1410]/5 border border-[#2B1410]/8">
          <div className="flex items-center gap-2 flex-1 px-4 py-2">
            <Search size={16} className="text-[#2B1410]/35 shrink-0" />
            <input
              type="text"
              placeholder="Search restaurants or dishes"
              className="w-full bg-transparent text-sm text-[#2B1410] placeholder:text-[#2B1410]/40 focus:outline-none"
            />
          </div>
          <button className="bg-[#2B1410] text-[#FDF6EC] text-sm font-medium px-6 py-2.5 rounded-full shrink-0 hover:bg-[#3D1E17] active:scale-95 transition-all duration-200">
            Search
          </button>
        </div>

        <p className="text-[#2B1410]/40 text-xs mt-4">
          Free delivery on orders over Rs. 999
        </p>
      </div>
    </div>
  );
}