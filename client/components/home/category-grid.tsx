// components/home/category-grid.tsx
"use client";

import { theme } from "@/config/theme";
import { AppImage } from "@/components/ui/app-image";
import type { Cuisine } from "@/lib/api/cuisines";

interface Category {
  slug: string;
  label: string;
  image: string;
}

const FALLBACK_IMAGE = "/images/food-2.avif";

const DEFAULT_CATEGORIES: Category[] = [
  { slug: "nepali", label: "Nepali", image: "/images/cuisine-nepali.jpg.avif" },
  { slug: "newari", label: "Newari", image: "/images/cuisine-newari.jpg.avif" },
  { slug: "fast-food", label: "Fast Food", image: "/images/cuisine-fastfood.jpg.avif" },
  { slug: "chinese", label: "Chinese", image: "/images/cuisine-chinese.jpg.avif" },
  { slug: "indian", label: "Indian", image: "/images/cuisine-indian.jpg.avif" },
  { slug: "desserts", label: "Desserts", image: "/images/cuisine-desserts.jpg.avif" },
];

const IMAGES = Object.fromEntries(DEFAULT_CATEGORIES.map((c) => [c.slug, c.image]));
const rank = (slug: string) => {
  const i = DEFAULT_CATEGORIES.findIndex((c) => c.slug === slug);
  return i === -1 ? DEFAULT_CATEGORIES.length : i;
};

function slugOf(c: Cuisine) {
  return c.slug ?? c.name.toLowerCase().replace(/\s+/g, "-");
}

const bounceStyle = `
@keyframes cuisine-pop {
  0% { transform: scale(1); }
  40% { transform: scale(0.9); }
  70% { transform: scale(1.08); }
  100% { transform: scale(1); }
}
`;

interface CategoryGridProps {
  cuisines?: Cuisine[];
  activeSlug: string | null;
  onSelect: (slug: string | null) => void;
}

export function CategoryGrid({ cuisines, activeSlug, onSelect }: CategoryGridProps) {
  const categories: Category[] =
    cuisines && cuisines.length > 0
      ? cuisines
          .map((c) => {
            const slug = slugOf(c);
            return { slug, label: c.name, image: IMAGES[slug] ?? FALLBACK_IMAGE };
          })
          .sort((x, y) => rank(x.slug) - rank(y.slug))
      : DEFAULT_CATEGORIES;

  return (
    <div>
      <style>{bounceStyle}</style>
      <h2 className="font-serif font-bold text-xl mb-4" style={{ color: theme.colors.dark }}>
        {theme.content.browseByCuisineHeading}
      </h2>
      <div className="flex gap-8 sm:gap-10 overflow-x-auto py-1.5 px-1 -mx-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {categories.map(({ slug, label, image }) => {
          const isActive = activeSlug === slug;
          return (
            <button
              key={slug}
              onClick={() => onSelect(isActive ? null : slug)}
              aria-pressed={isActive}
              className="shrink-0 flex flex-col items-center gap-2.5 relative group"
            >
              <span
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden block transition-all duration-200 group-hover:scale-105"
                style={{
                  boxShadow: isActive
                    ? `0 0 0 2.5px ${theme.colors.primary}`
                    : `0 1px 4px ${theme.colors.dark}1A`,
                  animation: isActive ? "cuisine-pop 0.4s ease" : "none",
                }}
              >
                <AppImage sizes="112px" src={image} alt={label} className="w-full h-full object-cover" />
              </span>
              <span
                className="text-sm font-semibold"
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