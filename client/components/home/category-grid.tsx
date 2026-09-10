// components/home/category-grid.tsx
"use client";

import { useState } from "react";
import {
  Soup,
  Beef,
  Pizza,
  Sandwich,
  Fish,
  IceCream,
  type LucideIcon,
} from "lucide-react";

interface Category {
  label: string;
  icon: LucideIcon;
}

// PLACEHOLDER — wired to GET /discovery/cuisines once we confirm the
// response shape; icons are assigned client-side by matching cuisine name.
const categories: Category[] = [
  { label: "Nepali", icon: Soup },
  { label: "Newari", icon: Beef },
  { label: "Momo", icon: Sandwich },
  { label: "Fast Food", icon: Pizza },
  { label: "Chinese", icon: Fish },
  { label: "Desserts", icon: IceCream },
];

export function CategoryGrid() {
  const [active, setActive] = useState<string | null>(null);

  return (
    <div>
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="font-serif font-semibold text-xl text-[#2B1410]">
          Browse by cuisine
        </h2>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {categories.map(({ label, icon: Icon }, index) => {
          const isActive = active === label;
          return (
            <button
              key={label}
              onClick={() => setActive(isActive ? null : label)}
              style={{ animationDelay: `${index * 60}ms` }}
              className={`flex flex-col items-center gap-2 py-4 rounded-[1.75rem] border transition-all duration-200 hover:shadow-md hover:-translate-y-1 active:scale-95 animate-in fade-in slide-in-from-bottom-2 fill-mode-backwards ${
                isActive
                  ? "bg-[#2B1410] border-[#2B1410] text-[#FDF6EC] scale-105 shadow-lg"
                  : "bg-white border-[#2B1410]/8 text-[#2B1410] hover:border-[#C0392B]/40"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${
                  isActive ? "bg-white/15 scale-110" : "bg-[#C0392B]/8"
                }`}
              >
                <Icon
                  size={20}
                  className={`transition-transform duration-200 ${
                    isActive ? "text-[#FDF6EC] scale-110" : "text-[#C0392B]"
                  }`}
                />
              </div>
              <span className="text-xs font-medium">{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}