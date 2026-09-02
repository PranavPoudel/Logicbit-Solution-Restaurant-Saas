// components/home/hero-section.tsx
"use client";

import { Search } from "lucide-react";

export function HeroSection() {
  return (
    <div className="relative overflow-hidden bg-[#FDF6EC] rounded-b-[2.5rem] min-h-[520px]">
      {/* scattered veggie icons, each floating on a staggered timer */}
      <FoodIcon
        className="absolute top-[10%] left-[6%] w-20 h-20 -rotate-12"
        variant="tomato"
        style={{ animation: "float 5s ease-in-out infinite", animationDelay: "0s" }}
      />
      <FoodIcon
        className="absolute top-[15%] right-[8%] w-16 h-16 rotate-45"
        variant="tomato"
        style={{ animation: "float 6s ease-in-out infinite", animationDelay: "0.5s" }}
      />
      <FoodIcon
        className="absolute top-[52%] left-[3%] w-24 h-24 rotate-6"
        variant="leaf"
        style={{ animation: "float 7s ease-in-out infinite", animationDelay: "1s" }}
      />
      <FoodIcon
        className="absolute bottom-[10%] right-[5%] w-20 h-20 -rotate-6"
        variant="tomato"
        style={{ animation: "float 5.5s ease-in-out infinite", animationDelay: "1.5s" }}
      />
      <FoodIcon
        className="absolute top-[6%] right-[30%] w-14 h-14 rotate-12 hidden sm:block"
        variant="chili"
        style={{ animation: "float 6.5s ease-in-out infinite", animationDelay: "0.8s" }}
      />
      <FoodIcon
        className="absolute bottom-[8%] left-[25%] w-16 h-16 -rotate-12 hidden sm:block"
        variant="tomato"
        style={{ animation: "float 6s ease-in-out infinite", animationDelay: "2s" }}
      />

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

function FoodIcon({
  className = "",
  variant = "tomato",
  style,
}: {
  className?: string;
  variant?: "tomato" | "chili" | "leaf";
  style?: React.CSSProperties;
}) {
  if (variant === "chili") {
    return (
      <svg viewBox="0 0 40 40" className={`${className} opacity-[0.22]`} style={style} fill="none">
        <path
          d="M10 8c4 0 6 4 6 8 0 6-4 14-10 18 8 0 16-6 18-14 2-8-2-14-8-14-2 0-4 1-6 2z"
          fill="#C0392B"
        />
      </svg>
    );
  }
  if (variant === "leaf") {
    return (
      <svg viewBox="0 0 40 40" className={`${className} opacity-[0.22]`} style={style} fill="none">
        <path d="M8 30c0-14 10-22 24-22-2 14-10 22-24 22z" fill="#5B8C5A" />
        <path d="M8 30 28 10" stroke="#3E6B3D" strokeWidth="1.5" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 40 40" className={`${className} opacity-[0.22]`} style={style} fill="none">
      <circle cx="20" cy="22" r="14" fill="#C0392B" />
      <path
        d="M16 10c1-2 3-3 4-3s3 1 4 3"
        stroke="#5B8C5A"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}