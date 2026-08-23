// components/owner-menu/category-list.tsx
"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

export interface OwnerCategory {
  id: string;
  name?: string;
}

interface CategoryListProps {
  categories: OwnerCategory[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onAdd: (name: string) => void;
  onDelete: (id: string) => void;
  isAdding: boolean;
}

export function CategoryList({
  categories,
  activeId,
  onSelect,
  onAdd,
  onDelete,
  isAdding,
}: CategoryListProps) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");

  function submit() {
    if (!name.trim()) return;
    onAdd(name.trim());
    setName("");
    setShowForm(false);
  }

  return (
    <div className="bg-white border border-neutral-200 rounded-xl p-3">
      <p className="text-xs font-medium text-neutral-500 px-2 mb-2">Categories</p>
      <ul className="space-y-0.5">
        {categories.map((cat) => (
          <li key={cat.id} className="group flex items-center">
            <button
              onClick={() => onSelect(cat.id)}
              className={`flex-1 text-left text-sm px-2.5 py-2 rounded-md truncate ${
                activeId === cat.id
                  ? "bg-[#1B2333] text-white"
                  : "text-neutral-700 hover:bg-neutral-100"
              }`}
            >
              {cat.name ?? "Untitled"}
            </button>
            <button
              onClick={() => onDelete(cat.id)}
              className="opacity-0 group-hover:opacity-100 text-neutral-300 hover:text-red-500 px-1.5"
              aria-label="Delete category"
            >
              <Trash2 size={13} />
            </button>
          </li>
        ))}
      </ul>

      {showForm ? (
        <div className="mt-2 px-1 space-y-1.5">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="Category name"
            className="w-full text-sm border border-neutral-200 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#E3A008]/40"
          />
          <div className="flex gap-1.5">
            <button
              onClick={submit}
              disabled={isAdding}
              className="text-xs font-medium bg-[#1B2333] text-white px-2.5 py-1.5 rounded-md disabled:opacity-50"
            >
              {isAdding ? "Adding…" : "Add"}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="text-xs text-neutral-500 px-2.5 py-1.5"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="mt-2 w-full flex items-center gap-1.5 text-xs font-medium text-[#1B2333] px-2.5 py-2 rounded-md hover:bg-neutral-100"
        >
          <Plus size={13} />
          Add category
        </button>
      )}
    </div>
  );
}
