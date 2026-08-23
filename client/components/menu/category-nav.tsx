// components/menu/category-nav.tsx
"use client";

interface CategoryNavProps {
  categories: Array<{ id: string; name?: string }>;
  activeId: string | null;
  onSelect: (id: string) => void;
}

export function CategoryNav({ categories, activeId, onSelect }: CategoryNavProps) {
  if (categories.length === 0) return null;

  return (
    <div className="sticky top-16 z-20 bg-[#FAFAF7]/95 backdrop-blur border-b border-[#E8E7E2]">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex gap-1 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onSelect(cat.id)}
              className={`shrink-0 text-sm font-medium px-3.5 py-3 border-b-2 transition-colors ${
                activeId === cat.id
                  ? "border-[#E3A008] text-[#17181C]"
                  : "border-transparent text-neutral-400 hover:text-[#17181C]"
              }`}
            >
              {cat.name ?? "Category"}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
