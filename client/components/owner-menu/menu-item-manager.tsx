// components/owner-menu/menu-item-manager.tsx
"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Image as ImageIcon, X, Check, Search } from "lucide-react";
import { menuItemsApi, type MenuItemInput } from "@/lib/api/menu";
import { uploadMedia } from "@/lib/api/media";
import { FindDuplicatesModal } from "./find-duplicates-modal";

interface MenuItemManagerProps {
  items: any[];
  categories: any[];
  restaurantId: string;
  isLoading: boolean;
}

const SPICE_LEVELS = ["NONE", "MILD", "MEDIUM", "HOT", "VERY_HOT"];
const HOMEPAGE_SECTIONS = ["TODAYS_SPECIAL", "BEST_SELLER", "CHEF_RECOMMENDED"];

export function MenuItemManager({ items, categories, restaurantId, isLoading }: MenuItemManagerProps) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showDuplicatesModal, setShowDuplicatesModal] = useState(false);
  
  // Form State
  const [name, setName] = useState("");
  const [nameJa, setNameJa] = useState("");
  const [price, setPrice] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?.id || "");
  const [spiceLevel, setSpiceLevel] = useState("NONE");
  const [description, setDescription] = useState("");
  const [descriptionJa, setDescriptionJa] = useState("");
  const [image, setImage] = useState<string | undefined>(undefined);
  const [sections, setSections] = useState<string[]>([]);

  const saveMutation = useMutation({
    mutationFn: (input: MenuItemInput) =>   
      editingId 
        ? menuItemsApi.update(restaurantId, editingId, input)
        : menuItemsApi.create(restaurantId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-menu-items", restaurantId] });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => menuItemsApi.remove(restaurantId, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["owner-menu-items", restaurantId] }),
  });

  // Fetch duplicates only when the modal is opened
  const duplicatesQuery = useQuery({
    queryKey: ["menu-duplicates", restaurantId],
    queryFn: () => menuItemsApi.findDuplicates(restaurantId),
    enabled: showDuplicatesModal,
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
    setPrice(""); 
    setCategoryId(categories[0]?.id || "");
    setSpiceLevel("NONE"); 
    setDescription(""); 
    setDescriptionJa(""); 
    setImage(undefined); 
    setSections([]);
  }

  function startEdit(item: any) {
    setEditingId(item.id);
    setName(item.name || ""); 
    setNameJa(item.nameJa || ""); 
    setPrice(String(item.price || ""));
    setCategoryId(item.categoryId || categories[0]?.id); 
    setSpiceLevel(item.spiceLevel || "NONE");
    setDescription(item.description || ""); 
    setDescriptionJa(item.descriptionJa || "");
    setImage(item.image); 
    setSections(item.homepageSections || []);
    setShowForm(true);
  }

  const toggleSection = (sec: string) => {
    setSections(prev => prev.includes(sec) ? prev.filter(s => s !== sec) : [...prev, sec]);
  };

  if (isLoading) return <p className="text-sm text-neutral-400 py-8 text-center">Loading items...</p>;

  return (
    <div className="space-y-4">
      {/* Header with Find Duplicates button */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-neutral-900">Menu Items ({items.length})</h2>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowDuplicatesModal(true)}
            className="flex items-center gap-2 bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Search size={16} /> Find Duplicates
          </button>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-[#E3A008] hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            <Plus size={16} /> New Menu Item
          </button>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
            <h3 className="text-sm font-semibold text-neutral-800">{editingId ? "Edit Item" : "New Menu Item"}</h3>
            <button onClick={resetForm}><X size={18} className="text-neutral-400" /></button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-600 mb-1">Name (English) *</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#E3A008]/20 focus:border-[#E3A008] outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-600 mb-1">Name (Japanese)</label>
              <input value={nameJa} onChange={(e) => setNameJa(e.target.value)} className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#E3A008]/20 focus:border-[#E3A008] outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-600 mb-1">Price (Rs) *</label>
              <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#E3A008]/20 focus:border-[#E3A008] outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-600 mb-1">Category</label>
              <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#E3A008]/20 focus:border-[#E3A008] outline-none bg-white">
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-600 mb-1">Spice Level</label>
              <select value={spiceLevel} onChange={(e) => setSpiceLevel(e.target.value)} className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#E3A008]/20 focus:border-[#E3A008] outline-none bg-white">
                {SPICE_LEVELS.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-600 mb-1">Description (English)</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#E3A008]/20 focus:border-[#E3A008] outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-600 mb-1">Description (Japanese)</label>
              <textarea value={descriptionJa} onChange={(e) => setDescriptionJa(e.target.value)} rows={2} className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#E3A008]/20 focus:border-[#E3A008] outline-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-600 mb-1">Feature Image</label>
            <div className="flex items-center gap-4">
              {image ? (
                <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-neutral-100">
                  <img src={image} alt="Preview" className="w-full h-full object-cover" />
                  <button onClick={() => setImage(undefined)} className="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-bl"><X size={12} /></button>
                </div>
              ) : (
                <label className="w-20 h-20 rounded-lg border-2 border-dashed border-neutral-300 flex items-center justify-center cursor-pointer hover:border-[#E3A008] transition-colors">
                  <ImageIcon size={20} className="text-neutral-400" />
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-600 mb-2">Homepage Sections</label>
            <div className="flex flex-wrap gap-3">
              {HOMEPAGE_SECTIONS.map(sec => (
                <label key={sec} className={`flex items-center gap-2 px-3 py-1.5 rounded-full border cursor-pointer text-sm transition-colors ${sections.includes(sec) ? 'bg-[#E3A008]/10 border-[#E3A008] text-[#E3A008]' : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50'}`}>
                  <input type="checkbox" checked={sections.includes(sec)} onChange={() => toggleSection(sec)} className="hidden" />
                  <Check size={14} className={sections.includes(sec) ? 'opacity-100' : 'opacity-0'} />
                  {sec.replace('_', ' ')}
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-neutral-100">
            <button onClick={resetForm} className="px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100 rounded-lg">Cancel</button>
            <button 
              onClick={() => saveMutation.mutate({ name, nameJa, price: Number(price), categoryId, spiceLevel, description, descriptionJa, image, homepageSections: sections })}
              disabled={saveMutation.isPending || !name.trim() || !price}
              className="px-4 py-2 text-sm font-medium bg-[#1B2333] text-white rounded-lg hover:bg-[#1B2333]/90 disabled:opacity-50"
            >
              {saveMutation.isPending ? "Saving..." : "Save Item"}
            </button>
          </div>
        </div>
      )}

      {/* List View */}
      <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
        <ul className="divide-y divide-neutral-100">
          {items.map((item) => (
            <li key={item.id} className="p-4 flex items-center justify-between hover:bg-neutral-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-neutral-100 overflow-hidden shrink-0">
                  {item.image ? <img src={item.image} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-neutral-400"><ImageIcon size={16} /></div>}
                </div>
                <div>
                  <p className="text-sm font-semibold text-neutral-900">{item.name} <span className="text-neutral-400 font-normal">({item.nameJa || "—"})</span></p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs font-mono text-neutral-600">Rs {item.price}</span>
                    {item.spiceLevel && item.spiceLevel !== 'NONE' && <span className="text-[10px] font-bold text-red-700 bg-red-100 px-1.5 py-0.5 rounded">{item.spiceLevel}</span>}
                    {item.homepageSections?.length > 0 && <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded">FEATURED</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => startEdit(item)} className="p-2 text-neutral-400 hover:text-[#E3A008] hover:bg-amber-50 rounded-lg transition-colors"><Pencil size={16} /></button>
                <button onClick={() => deleteMutation.mutate(item.id)} className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
              </div>
            </li>
          ))}
        </ul>
        {items.length === 0 && <p className="text-sm text-neutral-400 text-center py-8">No items in this category yet.</p>}
      </div>

      {/* Find Duplicates Modal */}
      {showDuplicatesModal && (
        <FindDuplicatesModal
          duplicates={duplicatesQuery.data ?? []}
          restaurantId={restaurantId}
          onClose={() => setShowDuplicatesModal(false)}
        />
      )}
    </div>
  );
}