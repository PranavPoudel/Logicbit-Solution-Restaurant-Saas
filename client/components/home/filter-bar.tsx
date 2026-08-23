// components/home/filter-bar.tsx
"use client";

import { useState } from "react";

const distanceOptions = ["2km", "5km", "10km"];
const cuisineOptions = ["Nepali", "Newari", "Indian", "Chinese", "Fast Food", "Momo"];

export function FilterBar() {
  const [activeDistance, setActiveDistance] = useState<string | null>(null);
  const [ratingOnly, setRatingOnly] = useState(false);
  const [activeCuisine, setActiveCuisine] = useState<string | null>(null);

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      {distanceOptions.map((d) => (
        <Chip
          key={d}
          label={d}
          active={activeDistance === d}
          onClick={() => setActiveDistance(activeDistance === d ? null : d)}
        />
      ))}
      <Chip
        label="4+ ★"
        active={ratingOnly}
        onClick={() => setRatingOnly((v) => !v)}
      />
      <span className="w-px h-5 bg-[#E8E7E2] mx-1 shrink-0" />
      {cuisineOptions.map((c) => (
        <Chip
          key={c}
          label={c}
          active={activeCuisine === c}
          onClick={() => setActiveCuisine(activeCuisine === c ? null : c)}
        />
      ))}
    </div>
  );
}

function Chip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 text-xs font-medium px-3.5 py-2 rounded-full border transition-colors ${
        active
          ? "bg-[#17181C] text-white border-[#17181C]"
          : "bg-white text-[#17181C] border-[#E8E7E2] hover:border-[#E3A008]"
      }`}
    >
      {label}
    </button>
  );
}
