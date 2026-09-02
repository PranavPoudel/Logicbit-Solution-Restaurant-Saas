"use client";

import { Cuisine } from "@/lib/api/cuisines";

interface FilterBarProps {
  cuisines: Cuisine[];
  isLoadingCuisines: boolean;
  activeCuisineId: string | null;
  onCuisineChange: (id: string | null) => void;
}

export function FilterBar({ 
  cuisines, 
  isLoadingCuisines, 
  activeCuisineId, 
  onCuisineChange 
}: FilterBarProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      {/* "All" Chip */}
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

      {/* Dynamic Cuisine Chips */}
      {isLoadingCuisines ? (
        // Loading skeleton to prevent layout shift
        Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="shrink-0 w-20 h-8 rounded-full bg-neutral-100 animate-pulse"
          />
        ))
      ) : (
        cuisines.map((cuisine) => {
          const isActive = activeCuisineId === cuisine.id;
          return (
            <button
              key={cuisine.id}
              onClick={() => onCuisineChange(isActive ? null : cuisine.id)}
              className={`shrink-0 text-xs font-medium px-3.5 py-2 rounded-full border transition-all ${
                isActive
                  ? "bg-[#E3A008] text-[#17181C] border-[#E3A008] shadow-sm"
                  : "bg-white text-[#17181C] border-[#E8E7E2] hover:border-[#E3A008]"
              }`}
            >
              {cuisine.name}
            </button>
          );
        })
      )}
    </div>
  );
}