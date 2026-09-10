// components/owner-menu/category-manager.tsx
"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Image as ImageIcon, X } from "lucide-react";
import { categoriesApi, type CategoryInput } from "@/lib/api/menu";
import { uploadMedia } from "@/lib/api/media";

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

  const saveMutation = useMutation({
    mutationFn: (input: CategoryInput) => 
      editingId 
        ? categoriesApi.update(restaurantId, editingId, input)
        : categoriesApi.create(restaurantId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-categories", restaurantId] });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => categoriesApi.remove(restaurantId, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["owner-categories", restaurantId] }),
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const res = await uploadMedia(file, restaurantId);
    setImage(res.url);
  };

  function resetForm() {
    setShowForm(false);
    setEditingId(null);
    setName("");
    setNameJa("");
    setImage(undefined);
    setIsOnHomepage(false);
  }

  function startEdit(cat: any) {
    setEditingId(cat.id);
    setName(cat.name || "");
    setNameJa(cat.nameJa || "");
    setImage(cat.image);
    setIsOnHomepage(cat.isOnHomepage || false);
    setShowForm(true);
  }

  if (isLoading) return <p className="text-sm text-neutral-400 py-8 text-center">Loading categories...</p>;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-neutral-900">Categories ({categories.length})</h2>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-[#E3A008] hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} /> New Category
        </button>
      </div>

      {/* Form Modal/Inline */}
      {showForm && (
        <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-neutral-800">{editingId ? "Edit Category" : "New Category"}</h3>
            <button onClick={resetForm}><X size={18} className="text-neutral-400" /></button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-neutral-600 mb-1">Name (English)</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#E3A008]/20 focus:border-[#E3A008] outline-none" placeholder="e.g. Curry" />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-600 mb-1">Name (Japanese)</label>
              <input value={nameJa} onChange={(e) => setNameJa(e.target.value)} className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#E3A008]/20 focus:border-[#E3A008] outline-none" placeholder="e.g. カレー" />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-xs font-medium text-neutral-600 mb-1">Category Image</label>
            <div className="flex items-center gap-4">
              {image ? (
                <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-neutral-100">
                  <img src={image} alt="Preview" className="w-full h-full object-cover" />
                  <button onClick={() => setImage(undefined)} className="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-bl"><X size={12} /></button>
                </div>
              ) : (
                <label className="w-16 h-16 rounded-lg border-2 border-dashed border-neutral-300 flex items-center justify-center cursor-pointer hover:border-[#E3A008] transition-colors">
                  <ImageIcon size={20} className="text-neutral-400" />
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 mb-6">
            <input type="checkbox" id="homepage" checked={isOnHomepage} onChange={(e) => setIsOnHomepage(e.target.checked)} className="accent-[#E3A008] w-4 h-4" />
            <label htmlFor="homepage" className="text-sm text-neutral-700">Show in homepage "Popular Categories" row</label>
          </div>

          <div className="flex justify-end gap-2">
            <button onClick={resetForm} className="px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100 rounded-lg">Cancel</button>
            <button 
              onClick={() => saveMutation.mutate({ name, nameJa, image, isOnHomepage })}
              disabled={saveMutation.isPending || !name.trim()}
              className="px-4 py-2 text-sm font-medium bg-[#1B2333] text-white rounded-lg hover:bg-[#1B2333]/90 disabled:opacity-50"
            >
              {saveMutation.isPending ? "Saving..." : "Save Category"}
            </button>
          </div>
        </div>
      )}

      {/* List View */}
      <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
        <ul className="divide-y divide-neutral-100">
          {categories.map((cat) => (
            <li key={cat.id} className="p-4 flex items-center justify-between hover:bg-neutral-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-neutral-100 overflow-hidden shrink-0">
                  {cat.image ? <img src={cat.image} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-neutral-400"><ImageIcon size={16} /></div>}
                </div>
                <div>
                  <p className="text-sm font-semibold text-neutral-900">{cat.name} <span className="text-neutral-400 font-normal">({cat.nameJa || "—"})</span></p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {cat.isOnHomepage && <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">ON HOMEPAGE</span>}
                    <span className="text-xs text-neutral-500">{cat.menuItems?.length || 0} items</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => startEdit(cat)} className="p-2 text-neutral-400 hover:text-[#E3A008] hover:bg-amber-50 rounded-lg transition-colors"><Pencil size={16} /></button>
                <button onClick={() => deleteMutation.mutate(cat.id)} className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
              </div>
            </li>
          ))}
        </ul>
        {categories.length === 0 && <p className="text-sm text-neutral-400 text-center py-8">No categories yet. Create one to get started.</p>}
      </div>
    </div>
  );
}