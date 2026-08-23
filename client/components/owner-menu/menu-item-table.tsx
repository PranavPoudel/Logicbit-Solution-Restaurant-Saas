// components/owner-menu/menu-item-table.tsx
"use client";

import { useState } from "react";
import { Plus, Trash2, SlidersHorizontal, Pencil } from "lucide-react";
import { ImageUpload } from "@/components/ui/image-upload";

export interface OwnerMenuItem {
  id: string;
  name?: string;
  price?: number;
  description?: string;
  isAvailable?: boolean;
  imageUrl?: string;
  image?: string;
  categoryId?: string;
}

export interface MenuItemFormValues {
  name: string;
  price: number;
  description?: string;
  imageUrl?: string;
  categoryId?: string;
  [key: string]: unknown;
}

interface MenuItemTableProps {
  restaurantId: string;
  items: OwnerMenuItem[];
  categories: Array<{ id: string; name?: string }>;
  activeCategoryId: string;
  onAdd: (input: MenuItemFormValues) => void;
  onUpdate: (id: string, input: MenuItemFormValues) => void;
  onDelete: (id: string) => void;
  onManageModifiers: (item: OwnerMenuItem) => void;
  isAdding: boolean;
  isUpdating: boolean;
  categoryName?: string;
}

export function MenuItemTable({
  restaurantId,
  items,
  categories,
  activeCategoryId,
  onAdd,
  onUpdate,
  onDelete,
  onManageModifiers,
  isAdding,
  isUpdating,
  categoryName,
}: MenuItemTableProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);
  const [categoryId, setCategoryId] = useState(activeCategoryId);

  function resetForm() {
    setName("");
    setPrice("");
    setDescription("");
    setImageUrl(undefined);
    setCategoryId(activeCategoryId);
    setEditingId(null);
    setShowForm(false);
  }

  function startAdd() {
    resetForm();
    setCategoryId(activeCategoryId);
    setShowForm(true);
  }

  function startEdit(item: OwnerMenuItem) {
    setEditingId(item.id);
    setName(item.name ?? "");
    setPrice(String(item.price ?? ""));
    setDescription(item.description ?? "");
    setImageUrl(item.imageUrl ?? item.image);
    setCategoryId(item.categoryId ?? activeCategoryId);
    setShowForm(true);
  }

  function submit() {
    const priceNum = Number(price);
    if (!name.trim() || !priceNum) return;
    const values: MenuItemFormValues = {
      name: name.trim(),
      price: priceNum,
      description: description.trim() || undefined,
      imageUrl,
      categoryId,
    };
    if (editingId) {
      onUpdate(editingId, values);
    } else {
      onAdd(values);
    }
    resetForm();
  }

  return (
    <div className="bg-white border border-neutral-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-neutral-800">
          {categoryName ?? "Items"}
        </h3>
        {!showForm && (
          <button
            onClick={startAdd}
            className="flex items-center gap-1.5 text-xs font-medium bg-[#1B2333] text-white px-3 py-1.5 rounded-md"
          >
            <Plus size={13} />
            Add item
          </button>
        )}
      </div>

      {showForm && (
        <div className="border border-neutral-200 rounded-lg p-3 mb-3 space-y-2">
          <div className="flex gap-3">
            <ImageUpload
              restaurantId={restaurantId}
              value={imageUrl}
              onChange={(url) => setImageUrl(url)}
              onRemove={() => setImageUrl(undefined)}
              className="w-20 h-20 shrink-0"
              label="Photo"
            />
            <div className="flex-1 space-y-2">
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Item name"
                className="w-full text-sm border border-neutral-200 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#E3A008]/40"
              />
              <input
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Price (Rs)"
                type="number"
                className="w-full text-sm border border-neutral-200 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#E3A008]/40"
              />
            </div>
          </div>

          {editingId && categories.length > 1 && (
            <div>
              <label className="block text-xs text-neutral-500 mb-1">Category</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full text-sm border border-neutral-200 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#E3A008]/40"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name ?? "Untitled category"}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-neutral-400 mt-1">
                An item can belong to one category at a time — changing this moves it out of {categoryName}.
              </p>
            </div>
          )}

          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            className="w-full text-sm border border-neutral-200 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#E3A008]/40"
          />
          <div className="flex gap-1.5">
            <button
              onClick={submit}
              disabled={isAdding || isUpdating}
              className="text-xs font-medium bg-[#1B2333] text-white px-3 py-1.5 rounded-md disabled:opacity-50"
            >
              {isAdding || isUpdating ? "Saving…" : editingId ? "Save changes" : "Save item"}
            </button>
            <button onClick={resetForm} className="text-xs text-neutral-500 px-3 py-1.5">
              Cancel
            </button>
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <p className="text-sm text-neutral-400 text-center py-8">
          No items in this category yet.
        </p>
      ) : (
        <ul className="divide-y divide-neutral-100">
          {items.map((item) => (
            <li key={item.id} className="group flex items-center justify-between py-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-neutral-100 overflow-hidden shrink-0">
                  {(item.imageUrl ?? item.image) && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.imageUrl ?? item.image}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-neutral-800 truncate">
                    {item.name ?? "Untitled"}
                  </p>
                  {item.description && (
                    <p className="text-xs text-neutral-400 truncate mt-0.5">
                      {item.description}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-sm font-mono text-neutral-700">Rs {item.price ?? 0}</span>
                <button
                  onClick={() => startEdit(item)}
                  className="text-neutral-400 hover:text-[#E3A008]"
                  aria-label="Edit item"
                  title="Edit item"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => onManageModifiers(item)}
                  className="text-neutral-400 hover:text-[#E3A008]"
                  aria-label="Manage modifiers"
                  title="Manage modifiers"
                >
                  <SlidersHorizontal size={14} />
                </button>
                <button
                  onClick={() => onDelete(item.id)}
                  className="opacity-0 group-hover:opacity-100 text-neutral-300 hover:text-red-500"
                  aria-label="Delete item"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}