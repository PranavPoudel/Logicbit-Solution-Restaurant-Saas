// components/owner-menu/category-manager.tsx
"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, X, Tag, Image as ImageIcon } from "lucide-react";
import { categoriesApi, type CategoryInput } from "@/lib/api/menu";
import { uploadMedia } from "@/lib/api/media";
import { ImageUpload } from "@/components/ui/image-upload";
import { FormField } from "@/components/ui/form-field";

interface CategoryManagerProps {
  categories: any[];
  restaurantId: string;
  isLoading: boolean;
}

export function CategoryManager({ categories, restaurantId, isLoading }: CategoryManagerProps) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [nameJa, setNameJa] = useState("");
  const [image, setImage] = useState<string | undefined>(undefined);
  const [isOnHomepage, setIsOnHomepage] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const saveMutation = useMutation({
    mutationFn: (input: CategoryInput) =>
      editingId
        ? categoriesApi.update(restaurantId, editingId, input)
        : categoriesApi.create(restaurantId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-categories", restaurantId] });
      resetForm();
    },
    onError: (err: any) => {
      setFormError(err?.response?.data?.message || "Failed to save category.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => categoriesApi.remove(restaurantId, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["owner-categories", restaurantId] }),
  });

  function resetForm() {
    setShowForm(false);
    setEditingId(null);
    setName("");
    setNameJa("");
    setImage(undefined);
    setIsOnHomepage(false);
    setFormError(null);
  }

  function startEdit(cat: any) {
    setEditingId(cat.id);
    setName(cat.name || "");
    setNameJa(cat.nameJa || "");
    setImage(cat.image);
    setIsOnHomepage(cat.isOnHomepage || false);
    setShowForm(true);
    setFormError(null);
  }

  function handleSave() {
    if (!name.trim()) {
      setFormError("Category name is required");
      return;
    }
    saveMutation.mutate({ name: name.trim(), nameJa: nameJa.trim() || undefined, image, isOnHomepage });
  }

  if (isLoading) return <p className="text-sm text-neutral-400 py-8 text-center">Loading categories...</p>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">Categories</h2>
          <p className="text-sm text-neutral-500 mt-0.5">
            Organize your menu items into categories. {categories.length} total.
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="flex items-center gap-2 bg-[#E3A008] hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} /> New Category
        </button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 bg-neutral-50">
            <h3 className="text-sm font-semibold text-neutral-800">
              {editingId ? "Edit Category" : "New Category"}
            </h3>
            <button onClick={resetForm}>
              <X size={18} className="text-neutral-400 hover:text-neutral-600" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {formError && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
                {formError}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Name (English) *"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Curry"
              />
              <FormField
                label="Name (Japanese)"
                value={nameJa}
                onChange={(e) => setNameJa(e.target.value)}
                placeholder="e.g. カレー"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#17181C] mb-1.5">Category Image</label>
              <div className="max-w-xs">
                <ImageUpload
                  restaurantId={restaurantId}
                  value={image}
                  onChange={(url) => setImage(url)}
                  onRemove={() => setImage(undefined)}
                  className="w-full h-40"
                  label="Click or drag to upload"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-neutral-50 rounded-lg border border-neutral-200">
              <input
                type="checkbox"
                id="homepage-toggle"
                checked={isOnHomepage}
                onChange={(e) => setIsOnHomepage(e.target.checked)}
                className="w-4 h-4 accent-[#E3A008] rounded"
              />
              <label htmlFor="homepage-toggle" className="text-sm text-neutral-700 cursor-pointer flex-1">
                <span className="font-medium">Show on homepage</span>
                <span className="block text-xs text-neutral-500 mt-0.5">
                  Display this category in the "Popular Categories" section on your restaurant's homepage
                </span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 px-6 py-4 border-t border-neutral-100 bg-neutral-50">
            <button
              onClick={resetForm}
              className="px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saveMutation.isPending}
              className="px-6 py-2 text-sm font-medium bg-[#1B2333] text-white rounded-lg hover:bg-[#1B2333]/90 disabled:opacity-50 transition-colors"
            >
              {saveMutation.isPending ? "Saving..." : editingId ? "Update Category" : "Create Category"}
            </button>
          </div>
        </div>
      )}

      {/* Categories List */}
      {categories.length === 0 ? (
        <div className="bg-white border border-neutral-200 rounded-xl p-12 text-center">
          <Tag className="mx-auto text-neutral-300 mb-3" size={32} />
          <p className="text-sm text-neutral-500">No categories yet. Create your first category to organize your menu.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="bg-white border border-neutral-200 rounded-xl p-5 hover:shadow-sm transition-shadow group"
            >
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-lg bg-neutral-100 overflow-hidden shrink-0 border border-neutral-200">
                  {cat.image ? (
                    <img src={cat.image} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-neutral-400">
                      <ImageIcon size={20} />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-neutral-900 truncate">{cat.name}</h3>
                  {cat.nameJa && <p className="text-xs text-neutral-500 mt-0.5">{cat.nameJa}</p>}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {cat.isOnHomepage && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        ON HOMEPAGE
                      </span>
                    )}
                    <span className="text-xs text-neutral-500">{cat.menuItems?.length || 0} items</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-1 mt-4 pt-3 border-t border-neutral-100 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => startEdit(cat)}
                  className="p-2 text-neutral-400 hover:text-[#E3A008] hover:bg-amber-50 rounded-lg transition-colors"
                  title="Edit category"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Delete "${cat.name}"? Items in this category won't be deleted.`)) {
                      deleteMutation.mutate(cat.id);
                    }
                  }}
                  className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete category"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}