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
import { theme } from "@/config/theme";

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
        <h2 className="font-serif font-semibold text-xl" style={{ color: theme.colors.dark }}>
          {theme.content.browseByCuisineHeading}
        </h2>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {categories.map(({ label, icon: Icon }, index) => {
          const isActive = active === label;
          return (
            <button
              key={label}
              onClick={() => setActive(isActive ? null : label)}
              style={{
                animationDelay: `${index * 60}ms`,
                backgroundColor: isActive ? theme.colors.dark : "#ffffff",
                borderColor: isActive ? theme.colors.dark : `${theme.colors.dark}14`,
                color: isActive ? theme.colors.background : theme.colors.dark,
              }}
              className="flex flex-col items-center gap-2 py-4 rounded-[1.75rem] border transition-all duration-200 hover:shadow-md hover:-translate-y-1 active:scale-95 animate-in fade-in slide-in-from-bottom-2 fill-mode-backwards"
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200"
                style={{
                  backgroundColor: isActive ? "rgba(255,255,255,0.15)" : `${theme.colors.primary}14`,
                  transform: isActive ? "scale(1.1)" : "scale(1)",
                }}
              >
                <Icon
                  size={20}
                  style={{ color: isActive ? theme.colors.background : theme.colors.primary }}
                  className="transition-transform duration-200"
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