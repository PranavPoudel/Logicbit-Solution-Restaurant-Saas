// components/menu/category-nav.tsx
"use client";

interface CategoryNavProps {
  categories: Array<{ id: string; name?: string }>;
  activeId: string | null;
  onSelect: (id: string) => void;
  className?: string;
}

export function CategoryNav({ categories, activeId, onSelect, className = "" }: CategoryNavProps) {
  if (categories.length === 0) return null;

  return (
    <div className={`sticky top-[72px] z-20 bg-[#FDF6EC]/95 backdrop-blur border-b border-[#2B1410]/8 ${className}`}>
      <div className="px-4">
        <div className="flex gap-1 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onSelect(cat.id)}
              className={`shrink-0 text-sm font-medium px-3.5 py-3 border-b-2 transition-colors ${
                activeId === cat.id
                  ? "border-[#C0392B] text-[#2B1410]"
                  : "border-transparent text-[#2B1410]/40 hover:text-[#2B1410]"
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