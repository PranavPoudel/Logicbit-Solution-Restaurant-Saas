// components/owner-menu/category-manager.tsx
"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Tag,
  Image as ImageIcon,
  ChevronDown,
  ChevronRight,
  FolderTree,
} from "lucide-react";
import { categoriesApi, type CategoryInput } from "@/lib/api/menu";
import { ImageUpload } from "@/components/ui/image-upload";
import { FormField } from "@/components/ui/form-field";

interface CategoryManagerProps {
  categories: any[];
  restaurantId: string;
  isLoading: boolean;
}

export function CategoryManager({
  categories,
  restaurantId,
  isLoading,
}: CategoryManagerProps) {
  const queryClient = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [nameJa, setNameJa] = useState("");
  const [image, setImage] = useState<string | undefined>(undefined);
  const [isOnHomepage, setIsOnHomepage] = useState(false);
  const [parentId, setParentId] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const saveMutation = useMutation({
    mutationFn: (input: CategoryInput) =>
      editingId
        ? categoriesApi.update(restaurantId, editingId, input)
        : categoriesApi.create(restaurantId, input),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["owner-categories", restaurantId],
      });
      queryClient.invalidateQueries({
        queryKey: ["owner-menu-items", restaurantId],
      });
      resetForm();
    },

    onError: (err: any) => {
      setFormError(
        err?.response?.data?.message || "Failed to save category."
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      categoriesApi.remove(restaurantId, id),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["owner-categories", restaurantId],
      });
      queryClient.invalidateQueries({
        queryKey: ["owner-menu-items", restaurantId],
      });
    },
  });

  function resetForm() {
    setShowForm(false);
    setEditingId(null);
    setName("");
    setNameJa("");
    setImage(undefined);
    setIsOnHomepage(false);
    setParentId("");
    setFormError(null);
  }

  function startEdit(cat: any) {
    setEditingId(cat.id);
    setName(cat.name || "");
    setNameJa(cat.nameJa || "");
    setImage(cat.image);
    setIsOnHomepage(Boolean(cat.isOnHomepage));
    setParentId(cat.parentId || cat.parent?.id || "");
    setShowForm(true);
    setFormError(null);
  }

  function handleSave() {
    setFormError(null);

    if (!name.trim()) {
      setFormError("Category name is required.");
      return;
    }

    if (parentId && parentId === editingId) {
      setFormError("A category cannot be its own parent.");
      return;
    }

    const selectedParent = categories.find(
      (category) => category.id === parentId
    );

    if (selectedParent?.parentId || selectedParent?.parent?.id) {
      setFormError(
        "Subcategories cannot have another subcategory. Select a parent category instead."
      );
      return;
    }

    const input: CategoryInput = {
      name: name.trim(),
      nameJa: nameJa.trim() || undefined,
      image,
      isOnHomepage,
      parentId: parentId || null,
    };

    saveMutation.mutate(input);
  }

  // Only top-level categories can be selected as parents.
  // Exclude the category being edited and its existing children.
  const parentOptions = categories.filter((category) => {
    const isTopLevel =
      !category.parentId && !category.parent?.id;

    const isNotSelf = category.id !== editingId;

    const isNotChildOfEditedCategory =
      !editingId ||
      !(
        category.parentId === editingId ||
        category.parent?.id === editingId
      );

    return (
      isTopLevel &&
      isNotSelf &&
      isNotChildOfEditedCategory
    );
  });

  const topLevelCategories = categories.filter(
    (category) => !category.parentId && !category.parent?.id
  );

  const getChildren = (categoryId: string) =>
    categories.filter(
      (category) =>
        (category.parentId || category.parent?.id) === categoryId
    );

  if (isLoading) {
    return (
      <p className="text-sm text-neutral-400 py-8 text-center">
        Loading categories...
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">
            Categories
          </h2>

          <p className="text-sm text-neutral-500 mt-0.5">
            Organize menu items into parent categories and subcategories.{" "}
            {categories.length} total.
          </p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="flex items-center gap-2 bg-[#E3A008] hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shrink-0"
        >
          <Plus size={16} />
          New Category
        </button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 bg-neutral-50">
            <h3 className="text-sm font-semibold text-neutral-800">
              {editingId ? "Edit Category" : "New Category"}
            </h3>

            <button
              type="button"
              onClick={resetForm}
              aria-label="Close category form"
            >
              <X
                size={18}
                className="text-neutral-400 hover:text-neutral-600"
              />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {formError && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
                {formError}
              </div>
            )}

            {/* Names */}
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

            {/* Parent Category */}
            <div>
              <label
                htmlFor="parent-category"
                className="block text-sm font-medium text-[#17181C] mb-1.5"
              >
                Parent Category
              </label>

              <select
                id="parent-category"
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
                className="w-full bg-white border border-[#E8E7E2] rounded-xl px-3.5 py-2.5 text-sm text-[#17181C] focus:outline-none focus:ring-2 focus:ring-[#E3A008]/40 focus:border-[#E3A008]"
              >
                <option value="">
                  None — Create a parent category
                </option>

                {parentOptions.map((category) => (
                  <option
                    key={category.id}
                    value={category.id}
                  >
                    {category.name}
                  </option>
                ))}
              </select>

              <p className="text-xs text-neutral-500 mt-1.5">
                Leave this empty for a parent category. Select an existing
                parent to create a subcategory.
              </p>
            </div>

            {/* Category Image */}
            <div>
              <label className="block text-sm font-medium text-[#17181C] mb-1.5">
                Category Image
              </label>

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

            {/* Homepage toggle */}
            <div className="flex items-center gap-3 p-4 bg-neutral-50 rounded-lg border border-neutral-200">
              <input
                type="checkbox"
                id="homepage-toggle"
                checked={isOnHomepage}
                onChange={(e) =>
                  setIsOnHomepage(e.target.checked)
                }
                className="w-4 h-4 accent-[#E3A008] rounded"
              />

              <label
                htmlFor="homepage-toggle"
                className="text-sm text-neutral-700 cursor-pointer flex-1"
              >
                <span className="font-medium">
                  Show on homepage
                </span>

                <span className="block text-xs text-neutral-500 mt-0.5">
                  Display this category in the Popular Categories section
                  on your restaurant homepage.
                </span>
              </label>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-2 px-6 py-4 border-t border-neutral-100 bg-neutral-50">
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-200 rounded-lg transition-colors"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={saveMutation.isPending}
              className="px-6 py-2 text-sm font-medium bg-[#1B2333] text-white rounded-lg hover:bg-[#1B2333]/90 disabled:opacity-50 transition-colors"
            >
              {saveMutation.isPending
                ? "Saving..."
                : editingId
                  ? "Update Category"
                  : parentId
                    ? "Create Subcategory"
                    : "Create Category"}
            </button>
          </div>
        </div>
      )}

      {/* Categories List */}
      {categories.length === 0 ? (
        <div className="bg-white border border-neutral-200 rounded-xl p-12 text-center">
          <Tag
            className="mx-auto text-neutral-300 mb-3"
            size={32}
          />

          <p className="text-sm text-neutral-500">
            No categories yet. Create your first category to organize
            your menu.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {topLevelCategories.map((category) => {
            const children = getChildren(category.id);

            return (
              <div
                key={category.id}
                className="bg-white border border-neutral-200 rounded-xl overflow-hidden"
              >
                {/* Parent Category */}
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-lg bg-neutral-100 overflow-hidden shrink-0 border border-neutral-200">
                      {category.image ? (
                        <img
                          src={category.image}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-neutral-400">
                          <ImageIcon size={20} />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <FolderTree
                          size={16}
                          className="text-[#E3A008] shrink-0"
                        />

                        <h3 className="text-sm font-semibold text-neutral-900">
                          {category.name}
                        </h3>

                        <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                          PARENT
                        </span>
                      </div>

                      {category.nameJa && (
                        <p className="text-xs text-neutral-500 mt-1">
                          {category.nameJa}
                        </p>
                      )}

                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {category.isOnHomepage && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                            ON HOMEPAGE
                          </span>
                        )}

                        <span className="text-xs text-neutral-500">
                          {category.menuItems?.length || 0} items
                        </span>

                        <span className="text-xs text-neutral-500">
                          {children.length} subcategor
                          {children.length === 1 ? "y" : "ies"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => startEdit(category)}
                        className="p-2 text-neutral-400 hover:text-[#E3A008] hover:bg-amber-50 rounded-lg transition-colors"
                        title="Edit parent category"
                      >
                        <Pencil size={14} />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const message = children.length
                            ? `Delete "${category.name}"? It has ${children.length} subcategory/subcategories.`
                            : `Delete "${category.name}"? Items in this category won't be deleted.`;

                          if (confirm(message)) {
                            deleteMutation.mutate(category.id);
                          }
                        }}
                        className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete category"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Subcategories */}
                {children.length > 0 && (
                  <div className="border-t border-neutral-100 bg-neutral-50/70">
                    <div className="px-5 py-3 flex items-center gap-2 text-xs font-semibold text-neutral-600">
                      <ChevronDown size={14} />
                      SUBCATEGORIES ({children.length})
                    </div>

                    <div className="px-5 pb-4 space-y-3">
                      {children.map((child) => (
                        <div
                          key={child.id}
                          className="bg-white border border-neutral-200 rounded-lg p-4 ml-3"
                        >
                          <div className="flex items-start gap-3">
                            <div className="pt-0.5 text-neutral-400">
                              <ChevronRight size={16} />
                            </div>

                            <div className="w-12 h-12 rounded-lg bg-neutral-100 overflow-hidden shrink-0 border border-neutral-200">
                              {child.image ? (
                                <img
                                  src={child.image}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-neutral-400">
                                  <ImageIcon size={16} />
                                </div>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="text-sm font-medium text-neutral-900">
                                  {child.name}
                                </h4>

                                <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                                  SUBCATEGORY
                                </span>
                              </div>

                              {child.nameJa && (
                                <p className="text-xs text-neutral-500 mt-0.5">
                                  {child.nameJa}
                                </p>
                              )}

                              <div className="flex items-center gap-2 mt-2 flex-wrap">
                                {child.isOnHomepage && (
                                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                                    ON HOMEPAGE
                                  </span>
                                )}

                                <span className="text-xs text-neutral-500">
                                  {child.menuItems?.length || 0} items
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => startEdit(child)}
                                className="p-2 text-neutral-400 hover:text-[#E3A008] hover:bg-amber-50 rounded-lg transition-colors"
                                title="Edit subcategory"
                              >
                                <Pencil size={14} />
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  if (
                                    confirm(
                                      `Delete "${child.name}"? Items in this category won't be deleted.`
                                    )
                                  ) {
                                    deleteMutation.mutate(child.id);
                                  }
                                }}
                                className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete subcategory"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Safety display for any categories that already have a parent
              but whose parent is missing from the current API response. */}
          {categories
            .filter(
              (category) =>
                (category.parentId || category.parent?.id) &&
                !categories.some(
                  (candidate) =>
                    candidate.id ===
                    (category.parentId || category.parent?.id)
                )
            )
            .map((category) => (
              <div
                key={category.id}
                className="bg-white border border-amber-200 rounded-xl p-5"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-semibold text-neutral-900">
                      {category.name}
                    </h3>

                    <p className="text-xs text-amber-700 mt-1">
                      Parent category information is unavailable.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => startEdit(category)}
                    className="p-2 text-neutral-400 hover:text-[#E3A008] hover:bg-amber-50 rounded-lg"
                    title="Edit category"
                  >
                    <Pencil size={14} />
                  </button>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}