// components/owner-menu/find-duplicates-modal.tsx
"use client";

import { X, Trash2, Image as ImageIcon } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { menuItemsApi } from "@/lib/api/menu";

interface DuplicateGroup {
  id: string;
  name: string;
  price: number;
  image?: string;
  createdAt: string;
  category?: { name: string };
}

interface FindDuplicatesModalProps {
  duplicates: DuplicateGroup[][]; // Array of groups, each group is an array of items
  restaurantId: string;
  onClose: () => void;
}

export function FindDuplicatesModal({ duplicates, restaurantId, onClose }: FindDuplicatesModalProps) {
  const queryClient = useQueryClient();

  const removeMutation = useMutation({
    mutationFn: (id: string) => menuItemsApi.remove(restaurantId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-menu-items", restaurantId] });
      // Note: In a real app, you'd optimistically update the UI or refetch duplicates here.
      // For simplicity, we'll just let the user close and reopen, or we can force a refetch.
      window.location.reload(); // Quick hack to refresh the modal state, or implement optimistic UI
    },
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div 
        onClick={(e) => e.stopPropagation()} 
        className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-100">
          <div>
            <h2 className="text-lg font-bold text-neutral-900">Duplicate Menu Items</h2>
            <p className="text-sm text-neutral-500 mt-1">
              Items sharing the exact same name. Review each group and remove the copy you don&apos;t want to keep.
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-neutral-100 rounded-lg transition-colors">
            <X size={20} className="text-neutral-500" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6 space-y-6">
          {duplicates.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-neutral-500">No duplicate items found. Your menu is clean!</p>
            </div>
          ) : (
            duplicates.map((group, groupIndex) => (
              <div key={groupIndex} className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-orange-800 mb-3">
                  &quot;{group[0].name}&quot; — {group.length} copies
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {group.map((item) => (
                    <div key={item.id} className="bg-white border border-orange-100 rounded-lg p-3 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-12 rounded-lg bg-neutral-100 overflow-hidden shrink-0">
                          {item.image ? (
                            <img src={item.image} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-neutral-400">
                              <ImageIcon size={16} />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-neutral-900 truncate">{item.name}</p>
                          <p className="text-xs text-neutral-500">
                            {item.category?.name || "Uncategorized"} · Rs {item.price}
                          </p>
                          <p className="text-[10px] text-neutral-400 mt-0.5">
                            Added {new Date(item.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeMutation.mutate(item.id)}
                        disabled={removeMutation.isPending}
                        className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors disabled:opacity-50"
                      >
                        <Trash2 size={12} />
                        Remove this one
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}