// components/home/search-bar.tsx
"use client";

import { Search } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  autoFocus?: boolean;
}

export function SearchBar({ value, onChange, autoFocus }: SearchBarProps) {
  return (
    <div className="relative">
      <Search
        size={18}
        className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400"
      />
      <input
        aria-label="Search restaurants or dishes"
        type="text"
        autoFocus={autoFocus}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search restaurants or dishes"
        className="w-full bg-white border border-[#E8E7E2] rounded-2xl pl-11 pr-4 py-3.5 text-sm text-[#17181C] placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#E3A008]/40 focus:border-[#E3A008]"
      />
    </div>
  );
}