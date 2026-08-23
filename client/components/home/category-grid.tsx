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
        <h2 className="font-display font-semibold text-lg text-[#17181C]">
          Browse by cuisine
        </h2>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {categories.map(({ label, icon: Icon }) => {
          const isActive = active === label;
          return (
            <button
              key={label}
              onClick={() => setActive(isActive ? null : label)}
              className={`flex flex-col items-center gap-2 py-4 rounded-2xl border transition-colors ${
                isActive
                  ? "bg-[#17181C] border-[#17181C] text-white"
                  : "bg-white border-[#E8E7E2] text-[#17181C] hover:border-[#E3A008]"
              }`}
            >
              <Icon
                size={22}
                className={isActive ? "text-[#E3A008]" : "text-[#0F6B5C]"}
              />
              <span className="text-xs font-medium">{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
