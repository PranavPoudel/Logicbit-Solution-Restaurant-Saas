// components/owner-menu/menu-item-manager.tsx
"use client";

import { useState, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, X, Check, Search, Flame, Tag } from "lucide-react";
import { menuItemsApi, type MenuItemInput } from "@/lib/api/menu";
import { uploadMedia } from "@/lib/api/media";
import { FindDuplicatesModal } from "./find-duplicates-modal";
import { ImageUpload } from "@/components/ui/image-upload";
import { FormField } from "@/components/ui/form-field";

interface MenuItemManagerProps {
  items: any[];
  categories: any[];
  restaurantId: string;
  isLoading: boolean;
}

const SPICE_LEVELS = [
  { value: "NONE", label: "No Spice", icon: "🟢" },
  { value: "MILD", label: "Mild", icon: "🌶️" },
  { value: "MEDIUM", label: "Medium", icon: "🌶️🌶️" },
  { value: "HOT", label: "Hot", icon: "🌶️🌶️️" },
  { value: "VERY_HOT", label: "Very Hot", icon: "" },
];

const HOMEPAGE_SECTIONS = [
  { value: "TODAYS_SPECIAL", label: "Today's Special" },
  { value: "BEST_SELLER", label: "Best Seller" },
  { value: "CHEF_RECOMMENDED", label: "Chef Recommended" },
];

export function MenuItemManager({ items, categories, restaurantId, isLoading }: MenuItemManagerProps) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showDuplicatesModal, setShowDuplicatesModal] = useState(false);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>("ALL");

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
  const [formError, setFormError] = useState<string | null>(null);

  const saveMutation = useMutation({
    mutationFn: (input: MenuItemInput) =>
      editingId
        ? menuItemsApi.update(restaurantId, editingId, input)
        : menuItemsApi.create(restaurantId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-menu-items", restaurantId] });
      queryClient.invalidateQueries({ queryKey: ["owner-categories", restaurantId] });
      resetForm();
    },
    onError: (err: any) => {
      setFormError(err?.response?.data?.message || "Failed to save. Please try again.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => menuItemsApi.remove(restaurantId, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["owner-menu-items", restaurantId] }),
  });

  const duplicatesQuery = useQuery({
    queryKey: ["menu-duplicates", restaurantId],
    queryFn: () => menuItemsApi.findDuplicates(restaurantId),
    enabled: showDuplicatesModal,
  });

  // Filter items by selected category
  const filteredItems = useMemo(() => {
    if (activeCategoryFilter === "ALL") return items;
    return items.filter((item) => item.categoryId === activeCategoryFilter);
  }, [items, activeCategoryFilter]);

  // Group items by category for visual organization
  const groupedItems = useMemo(() => {
    if (activeCategoryFilter !== "ALL") {
      // When filtered, just return as single group
      const cat = categories.find((c) => c.id === activeCategoryFilter);
      return [{ categoryId: activeCategoryFilter, categoryName: cat?.name || "Unknown", items: filteredItems }];
    }
    // Group by category
    const groups: Record<string, { categoryName: string; items: any[] }> = {};
    filteredItems.forEach((item) => {
      const catId = item.categoryId || "uncategorized";
      const cat = categories.find((c) => c.id === catId);
      if (!groups[catId]) {
        groups[catId] = { categoryName: cat?.name || "Uncategorized", items: [] };
      }
      groups[catId].items.push(item);
    });
    return Object.entries(groups).map(([categoryId, { categoryName, items }]) => ({
      categoryId,
      categoryName,
      items,
    }));
  }, [filteredItems, categories, activeCategoryFilter]);

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
    setFormError(null);
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
    setFormError(null);
  }

  function handleSave() {
    if (!name.trim()) {
      setFormError("Item name is required");
      return;
    }
    if (!price || Number(price) <= 0) {
      setFormError("Please enter a valid price");
      return;
    }
    if (!categoryId) {
      setFormError("Please select a category");
      return;
    }

    saveMutation.mutate({
      name: name.trim(),
      nameJa: nameJa.trim() || undefined,
      price: Number(price),
      categoryId,
      spiceLevel,
      description: description.trim() || undefined,
      descriptionJa: descriptionJa.trim() || undefined,
      image,
      homepageSections: sections,
    });
  }

  const toggleSection = (sec: string) => {
    setSections((prev) => (prev.includes(sec) ? prev.filter((s) => s !== sec) : [...prev, sec]));
  };

  const getSpiceInfo = (level: string) => {
    return SPICE_LEVELS.find((s) => s.value === level) || SPICE_LEVELS[0];
  };

  if (isLoading) return <p className="text-sm text-neutral-400 py-8 text-center">Loading items...</p>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">Menu Items</h2>
          <p className="text-sm text-neutral-500 mt-0.5">
            {filteredItems.length} item{filteredItems.length !== 1 ? "s" : ""}{" "}
            {activeCategoryFilter !== "ALL" && `in ${categories.find((c) => c.id === activeCategoryFilter)?.name || ""}`}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowDuplicatesModal(true)}
            className="flex items-center gap-2 bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Search size={16} /> Find Duplicates
          </button>
          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="flex items-center gap-2 bg-[#E3A008] hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={16} /> New Menu Item
          </button>
        </div>
      </div>

      {/* Category Filter Chips */}
      <div className="flex flex-wrap gap-2 pb-4 border-b border-neutral-200">
        <button
          onClick={() => setActiveCategoryFilter("ALL")}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            activeCategoryFilter === "ALL"
              ? "bg-[#1B2333] text-white"
              : "bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-50"
          }`}
        >
          All ({items.length})
        </button>
        {categories.map((cat) => {
          const count = items.filter((i) => i.categoryId === cat.id).length;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategoryFilter(cat.id)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeCategoryFilter === cat.id
                  ? "bg-[#1B2333] text-white"
                  : "bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-50"
              }`}
            >
              {cat.name} ({count})
            </button>
          );
        })}
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 bg-neutral-50">
            <h3 className="text-sm font-semibold text-neutral-800">
              {editingId ? "Edit Menu Item" : "New Menu Item"}
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

            {/* Names Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Name (English) *"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Chicken Curry"
              />
              <FormField
                label="Name (Japanese)"
                value={nameJa}
                onChange={(e) => setNameJa(e.target.value)}
                placeholder="e.g. チキンカレー"
              />
            </div>

            {/* Price + Category + Spice */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                label="Price (Rs) *"
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0"
                min="0"
              />
              <div>
                <label className="block text-sm font-medium text-[#17181C] mb-1.5">Category *</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full bg-white border border-[#E8E7E2] rounded-xl px-3.5 py-2.5 text-sm text-[#17181C] focus:outline-none focus:ring-2 focus:ring-[#E3A008]/40 focus:border-[#E3A008]"
                >
                  <option value="">Select a category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#17181C] mb-1.5">Spice Level</label>
                <select
                  value={spiceLevel}
                  onChange={(e) => setSpiceLevel(e.target.value)}
                  className="w-full bg-white border border-[#E8E7E2] rounded-xl px-3.5 py-2.5 text-sm text-[#17181C] focus:outline-none focus:ring-2 focus:ring-[#E3A008]/40 focus:border-[#E3A008]"
                >
                  {SPICE_LEVELS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.icon} {s.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Descriptions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#17181C] mb-1.5">Description (English)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Brief description of the dish..."
                  className="w-full bg-white border border-[#E8E7E2] rounded-xl px-3.5 py-2.5 text-sm text-[#17181C] placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#E3A008]/40 focus:border-[#E3A008] resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#17181C] mb-1.5">Description (Japanese)</label>
                <textarea
                  value={descriptionJa}
                  onChange={(e) => setDescriptionJa(e.target.value)}
                  rows={3}
                  placeholder="料理の簡単な説明..."
                  className="w-full bg-white border border-[#E8E7E2] rounded-xl px-3.5 py-2.5 text-sm text-[#17181C] placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#E3A008]/40 focus:border-[#E3A008] resize-none"
                />
              </div>
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-[#17181C] mb-1.5">Feature Image</label>
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

            {/* Homepage Sections */}
            <div>
              <label className="block text-sm font-medium text-[#17181C] mb-2">
                Homepage Sections <span className="text-neutral-400 font-normal">(optional)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {HOMEPAGE_SECTIONS.map((sec) => {
                  const isSelected = sections.includes(sec.value);
                  return (
                    <button
                      key={sec.value}
                      type="button"
                      onClick={() => toggleSection(sec.value)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                        isSelected
                          ? "bg-[#E3A008]/10 border-[#E3A008] text-[#B8860B]"
                          : "bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                      }`}
                    >
                      <Check size={14} className={isSelected ? "opacity-100" : "opacity-0"} />
                      {sec.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Form Actions */}
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
              {saveMutation.isPending ? "Saving..." : editingId ? "Update Item" : "Create Item"}
            </button>
          </div>
        </div>
      )}

      {/* Items List - Grouped by Category */}
      {groupedItems.length === 0 ? (
        <div className="bg-white border border-neutral-200 rounded-xl p-12 text-center">
          <Tag className="mx-auto text-neutral-300 mb-3" size={32} />
          <p className="text-sm text-neutral-500">
            {activeCategoryFilter === "ALL"
              ? "No menu items yet. Create your first item to get started."
              : "No items in this category yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {groupedItems.map((group) => (
            <div key={group.categoryId}>
              {activeCategoryFilter === "ALL" && (
                <h3 className="text-sm font-semibold text-neutral-700 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#E3A008]"></span>
                  {group.categoryName}
                  <span className="text-xs font-normal text-neutral-400">({group.items.length})</span>
                </h3>
              )}
              <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
                <ul className="divide-y divide-neutral-100">
                  {group.items.map((item) => {
                    const spice = getSpiceInfo(item.spiceLevel || "NONE");
                    return (
                      <li key={item.id} className="p-4 flex items-center justify-between hover:bg-neutral-50 transition-colors group">
                        <div className="flex items-center gap-4 min-w-0 flex-1">
                          <div className="w-14 h-14 rounded-lg bg-neutral-100 overflow-hidden shrink-0 border border-neutral-200">
                            {item.image ? (
                              <img src={item.image} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-neutral-400">
                                <Tag size={18} />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-semibold text-neutral-900">{item.name}</p>
                              {item.nameJa && (
                                <span className="text-xs text-neutral-400 font-normal">{item.nameJa}</span>
                              )}
                              {item.spiceLevel && item.spiceLevel !== "NONE" && (
                                <span className="text-xs" title={spice.label}>
                                  {spice.icon}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-sm font-mono text-neutral-700 font-medium">Rs {item.price}</span>
                              {item.description && (
                                <span className="text-xs text-neutral-500 truncate max-w-md">
                                  {item.description}
                                </span>
                              )}
                              {item.homepageSections?.length > 0 && (
                                <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                                  FEATURED
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => startEdit(item)}
                            className="p-2 text-neutral-400 hover:text-[#E3A008] hover:bg-amber-50 rounded-lg transition-colors"
                            title="Edit item"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Delete "${item.name}"? It will be moved to Trash.`)) {
                                deleteMutation.mutate(item.id);
                              }
                            }}
                            className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete item"
                          >
                            <Trash2 size={14} />
          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}

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