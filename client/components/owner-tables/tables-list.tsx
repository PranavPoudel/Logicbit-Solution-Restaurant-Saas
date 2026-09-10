// components/owner-tables/tables-list.tsx
"use client";

import { useState } from "react";
import { useMutation, type QueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Users, MapPin, X, LayoutGrid } from "lucide-react";
import { tablesApi, type RestaurantTable, type CreateTableDto } from "@/lib/api/tables";

interface TablesListProps {
  tables: RestaurantTable[];
  restaurantId: string;
  queryClient: QueryClient;
}

export function TablesList({ tables, restaurantId, queryClient }: TablesListProps) {
  const [showModal, setShowModal] = useState(false);
  const [editingTable, setEditingTable] = useState<RestaurantTable | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState("");
  const [zone, setZone] = useState("");
  const [displayOrder, setDisplayOrder] = useState("0");

  const saveMutation = useMutation({
    mutationFn: (dto: CreateTableDto) =>
      editingTable
        ? tablesApi.update(restaurantId, editingTable.id, dto)
        : tablesApi.create(restaurantId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-tables", restaurantId] });
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => tablesApi.remove(restaurantId, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["owner-tables", restaurantId] }),
  });

  function openAdd() {
    setEditingTable(null);
    setName(""); setCapacity(""); setZone(""); setDisplayOrder("0");
    setShowModal(true);
  }

  function openEdit(table: RestaurantTable) {
    setEditingTable(table);
    setName(table.name);
    setCapacity(String(table.capacity));
    setZone(table.zone || "");
    setDisplayOrder(String(table.displayOrder));
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingTable(null);
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-neutral-900">Tables ({tables.length})</h2>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-[#E3A008] hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} /> Add Table
        </button>
      </div>

      {/* Grid View */}
      {tables.length === 0 ? (
        <div className="bg-white border border-neutral-200 rounded-xl p-10 text-center">
          <LayoutGrid className="mx-auto text-neutral-300 mb-3" size={32} />
          <p className="text-sm text-neutral-500">No tables yet. Add your first table to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tables.map((table) => (
            <div key={table.id} className="bg-white border border-neutral-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-base font-semibold text-neutral-900">{table.name}</h3>
                  {table.zone && (
                    <div className="flex items-center gap-1 mt-1">
                      <MapPin size={12} className="text-neutral-400" />
                      <span className="text-xs text-neutral-500">{table.zone}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded-md">
                  <Users size={12} />
                  <span className="text-xs font-semibold">{table.capacity}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-neutral-100">
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                  {table.reservations?.length || 0} active
                </span>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(table)} className="p-1.5 text-neutral-400 hover:text-[#E3A008] hover:bg-amber-50 rounded-lg transition-colors">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => deleteMutation.mutate(table.id)} className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={closeModal}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-neutral-100">
              <h3 className="text-base font-semibold text-neutral-900">{editingTable ? "Edit Table" : "Add New Table"}</h3>
              <button onClick={closeModal}><X size={18} className="text-neutral-400" /></button>
            </div>
            
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1">Table Name *</label>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Table 01" className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#E3A008]/20 focus:border-[#E3A008] outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1">Capacity (Guests) *</label>
                  <input type="number" value={capacity} onChange={(e) => setCapacity(e.target.value)} placeholder="4" className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#E3A008]/20 focus:border-[#E3A008] outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1">Display Order</label>
                  <input type="number" value={displayOrder} onChange={(e) => setDisplayOrder(e.target.value)} className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#E3A008]/20 focus:border-[#E3A008] outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1">Zone (Optional)</label>
                <input value={zone} onChange={(e) => setZone(e.target.value)} placeholder="e.g. Indoor, Patio, Bar" className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#E3A008]/20 focus:border-[#E3A008] outline-none" />
              </div>
            </div>

            <div className="flex justify-end gap-2 p-5 border-t border-neutral-100 bg-neutral-50 rounded-b-2xl">
              <button onClick={closeModal} className="px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-200 rounded-lg">Cancel</button>
              <button
                onClick={() => saveMutation.mutate({ name, capacity: Number(capacity), zone: zone || undefined, displayOrder: Number(displayOrder) })}
                disabled={saveMutation.isPending || !name.trim() || !capacity}
                className="px-4 py-2 text-sm font-medium bg-[#1B2333] text-white rounded-lg hover:bg-[#1B2333]/90 disabled:opacity-50"
              >
                {saveMutation.isPending ? "Saving..." : "Save Table"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}