// components/owner-menu/menu-trash-bin.tsx
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { RotateCcw, Trash2, AlertTriangle } from "lucide-react";
import { useMoney } from "@/hooks/use-money";
import { categoriesApi, menuItemsApi } from "@/lib/api/menu";

interface MenuTrashBinProps {
  categories: any[];
  items: any[];
  restaurantId: string;
  isLoading: boolean;
}

export function MenuTrashBin({ categories, items, restaurantId, isLoading }: MenuTrashBinProps) {
  const money = useMoney();
  const queryClient = useQueryClient();

  // Filter only deleted items (those with a deletedAt timestamp)
  const deletedCategories = categories.filter(c => c.deletedAt);
  const deletedItems = items.filter(i => i.deletedAt);

  const restoreCatMutation = useMutation({
    mutationFn: (id: string) => categoriesApi.restore(restaurantId, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["owner-categories", restaurantId] }),
  });

  const permDeleteCatMutation = useMutation({
    mutationFn: (id: string) => categoriesApi.permanentDelete(restaurantId, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["owner-categories", restaurantId] }),
  });

  const restoreItemMutation = useMutation({
    mutationFn: (id: string) => menuItemsApi.restore(restaurantId, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["owner-menu-items", restaurantId] }),
  });

  const permDeleteItemMutation = useMutation({
    mutationFn: (id: string) => menuItemsApi.permanentDelete(restaurantId, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["owner-menu-items", restaurantId] }),
  });

  if (isLoading) return <p className="text-sm text-neutral-400 py-8 text-center">Loading trash...</p>;

  return (
    <div className="space-y-6">
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-red-700">Trash Bin</p>
          <p className="text-xs text-red-600 mt-0.5">Items here are hidden from your store. Restore them to bring them back, or delete them permanently.</p>
        </div>
      </div>

      {/* Deleted Categories */}
      <div>
        <h3 className="text-sm font-semibold text-neutral-800 mb-3">Deleted Categories ({deletedCategories.length})</h3>
        <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
          {deletedCategories.length === 0 ? (
            <p className="text-sm text-neutral-400 text-center py-6">No deleted categories.</p>
          ) : (
            <ul className="divide-y divide-neutral-100">
              {deletedCategories.map(cat => (
                <li key={cat.id} className="p-4 flex items-center justify-between">
                  <span className="text-sm text-neutral-700">{cat.name} <span className="text-neutral-400">({cat.nameJa})</span></span>
                  <div className="flex gap-2">
                    <button onClick={() => restoreCatMutation.mutate(cat.id)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors">
                      <RotateCcw size={12} /> Restore
                    </button>
                    <button onClick={() => permDeleteCatMutation.mutate(cat.id)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
                      <Trash2 size={12} /> Delete Forever
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Deleted Items */}
      <div>
        <h3 className="text-sm font-semibold text-neutral-800 mb-3">Deleted Menu Items ({deletedItems.length})</h3>
        <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
          {deletedItems.length === 0 ? (
            <p className="text-sm text-neutral-400 text-center py-6">No deleted menu items.</p>
          ) : (
            <ul className="divide-y divide-neutral-100">
              {deletedItems.map(item => (
                <li key={item.id} className="p-4 flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-neutral-800">{item.name}</span>
                    <span className="text-xs text-neutral-500 ml-2">{money(item.price)}</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => restoreItemMutation.mutate(item.id)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors">
                      <RotateCcw size={12} /> Restore
                    </button>
                    <button onClick={() => permDeleteItemMutation.mutate(item.id)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
                      <Trash2 size={12} /> Delete Forever
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}