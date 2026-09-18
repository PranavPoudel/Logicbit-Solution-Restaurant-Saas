// components/home/category-grid.tsx
"use client";

import { useState } from "react";
import { theme } from "@/config/theme";

interface Category {
  label: string;
  image: string;
}

// PLACEHOLDER — wired to GET /discovery/cuisines once we confirm the
// response shape; swap these image URLs for real per-cuisine photos.
const categories: Category[] = [
  { label: "Nepali", image: "/images/cuisine-nepali.jpg.avif" },
  { label: "Newari", image: "/images/cuisine-newari.jpg.avif" },
  { label: "Fast Food", image: "/images/cuisine-fastfood.jpg.avif" },
  { label: "Chinese", image: "/images/cuisine-chinese.jpg.avif" },
  { label: "Indian", image: "/images/cuisine-indian.jpg.avif" },
  { label: "Desserts", image: "/images/cuisine-desserts.jpg.avif" },
];

const bounceStyle = `
@keyframes cuisine-pop {
  0% { transform: scale(1); }
  40% { transform: scale(0.9); }
  70% { transform: scale(1.08); }
  100% { transform: scale(1); }
}
`;

export function CategoryGrid() {
  const [active, setActive] = useState<string | null>(null);

  return (
    <div>
      <style>{bounceStyle}</style>
      <h2 className="font-serif font-semibold text-lg mb-3" style={{ color: theme.colors.dark }}>
        {theme.content.browseByCuisineHeading}
      </h2>
      <div className="flex gap-4 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {categories.map(({ label, image }) => {
          const isActive = active === label;
          return (
            <button
              key={label}
              onClick={() => setActive(isActive ? null : label)}
              className="shrink-0 flex flex-col items-center gap-1.5 relative"
            >
              <span
                className="w-16 h-16 rounded-full overflow-hidden block transition-all duration-150"
                style={{
                  boxShadow: isActive
                    ? `0 0 0 2.5px ${theme.colors.primary}`
                    : `0 1px 4px ${theme.colors.dark}1A`,
                  animation: isActive ? "cuisine-pop 0.4s ease" : "none",
                }}
              >
                <img src={image} alt={label} className="w-full h-full object-cover" />
              </span>
              <span
                className="text-xs font-medium"
                style={{ color: isActive ? theme.colors.primary : theme.colors.dark }}
              >
                {label}
              </span>
              {isActive && (
                <span
                  className="w-0 h-0 -mt-0.5"
                  style={{
                    borderLeft: "5px solid transparent",
                    borderRight: "5px solid transparent",
                    borderTop: `6px solid ${theme.colors.primary}`,
                  }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}