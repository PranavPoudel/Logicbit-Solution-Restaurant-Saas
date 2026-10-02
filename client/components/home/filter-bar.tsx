// components/home/filter-bar.tsx
"use client";

import Link from "next/link";
import { Cuisine } from "@/lib/api/cuisines";

interface FilterBarProps {
  cuisines: Cuisine[];
  isLoadingCuisines: boolean;
  activeCuisineId: string | null;
  onCuisineChange: (id: string | null) => void;
}

const QUICK_TAGS = [
  { label: "Trending now", slug: "trending" },
  { label: "New on LogicBit", slug: "new" },
  { label: "Popular this week", slug: "popular" },
];

export function FilterBar({
  activeCuisineId,
  onCuisineChange,
}: FilterBarProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      <button
        onClick={() => onCuisineChange(null)}
        className={`shrink-0 text-xs font-medium px-3.5 py-2 rounded-full border transition-all ${
          activeCuisineId === null
            ? "bg-[#17181C] text-white border-[#17181C] shadow-sm"
            : "bg-white text-[#17181C] border-[#E8E7E2] hover:border-[#E3A008]"
        }`}
      >
        All
      </button>

      {QUICK_TAGS.map((tag) => (
        <Link
          key={tag.slug}
          href={`/explore/${tag.slug}`}
          className="shrink-0 text-xs font-medium px-3.5 py-2 rounded-full border bg-white text-[#17181C] border-[#E8E7E2] hover:border-[#E3A008] hover:bg-[#E3A008]/5 transition-all"
        >
          {tag.label}
        </Link>
      ))}
    </div>
  );
}