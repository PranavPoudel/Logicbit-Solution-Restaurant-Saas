// components/owner-tables/tables-trash-bin.tsx
"use client";

import { useMutation, type QueryClient } from "@tanstack/react-query";
import { RotateCcw, Trash2, AlertTriangle, LayoutGrid } from "lucide-react";
import { tablesApi, type RestaurantTable } from "@/lib/api/tables";

interface TablesTrashBinProps {
  tables: RestaurantTable[];
  restaurantId: string;
  queryClient: QueryClient;
}

export function TablesTrashBin({ tables, restaurantId, queryClient }: TablesTrashBinProps) {
  const restoreMutation = useMutation({
    mutationFn: (id: string) => tablesApi.restore(restaurantId, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["owner-tables", restaurantId] }),
  });

  const permDeleteMutation = useMutation({
    mutationFn: (id: string) => tablesApi.permanentDelete(restaurantId, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["owner-tables", restaurantId] }),
  });

  return (
    <div className="space-y-4">
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-red-700">Trash Bin</p>
          <p className="text-xs text-red-600 mt-0.5">Tables here are hidden from your floor plan. Restore them to bring them back, or delete them permanently.</p>
        </div>
      </div>

      {tables.length === 0 ? (
        <div className="bg-white border border-neutral-200 rounded-xl p-10 text-center">
          <LayoutGrid className="mx-auto text-neutral-300 mb-3" size={32} />
          <p className="text-sm text-neutral-500">Trash is empty.</p>
        </div>
      ) : (
        <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
          <ul className="divide-y divide-neutral-100">
            {tables.map((table) => (
              <li key={table.id} className="p-4 flex items-center justify-between hover:bg-neutral-50">
                <div>
                  <span className="text-sm font-medium text-neutral-800">{table.name}</span>
                  <span className="text-xs text-neutral-500 ml-2">· {table.capacity} guests</span>
                  {table.zone && <span className="text-xs text-neutral-400 ml-2">· {table.zone}</span>}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => restoreMutation.mutate(table.id)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors">
                    <RotateCcw size={12} /> Restore
                  </button>
                  <button onClick={() => permDeleteMutation.mutate(table.id)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
                    <Trash2 size={12} /> Delete Forever
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}