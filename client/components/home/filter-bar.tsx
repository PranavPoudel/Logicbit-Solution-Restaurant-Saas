// components/home/filter-bar.tsx
"use client";

import { Cuisine } from "@/lib/api/cuisines";

export type QuickTag = "trending" | "new" | "popular";

export const QUICK_TAGS: { label: string; slug: QuickTag }[] = [
  { label: "Trending now", slug: "trending" },
  { label: "New on LogicBit", slug: "new" },
  { label: "Popular this week", slug: "popular" },
];

interface FilterBarProps {
  cuisines: Cuisine[];
  isLoadingCuisines: boolean;
  activeCuisineId: string | null;
  onCuisineChange: (id: string | null) => void;
  activeTag: QuickTag | null;
  onTagChange: (tag: QuickTag | null) => void;
}

const CHIP =
  "shrink-0 text-sm font-medium px-5 py-2.5 rounded-full border transition-all duration-300 ease-out active:scale-95";
const CHIP_ON = "bg-brand-ink text-white border-brand-ink shadow-sm";
const CHIP_OFF = "bg-white text-brand-ink border-brand-line hover:border-brand-gold hover:bg-brand-gold/5";

export function FilterBar({
  activeCuisineId,
  onCuisineChange,
  activeTag,
  onTagChange,
}: FilterBarProps) {
  const allActive = activeCuisineId === null && activeTag === null;

  return (
    <div className="flex items-center gap-2.5 overflow-x-auto py-1 px-1 -mx-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      <button
        type="button"
        onClick={() => {
          onCuisineChange(null);
          onTagChange(null);
        }}
        aria-pressed={allActive}
        className={`${CHIP} ${allActive ? CHIP_ON : CHIP_OFF}`}
      >
        All
      </button>

      {QUICK_TAGS.map((tag) => {
        const active = activeTag === tag.slug;
        return (
          <button
            key={tag.slug}
            type="button"
            onClick={() => onTagChange(active ? null : tag.slug)}
            aria-pressed={active}
            className={`${CHIP} ${active ? CHIP_ON : CHIP_OFF}`}
          >
            {tag.label}
          </button>
        );
      })}
    </div>
  );
}
