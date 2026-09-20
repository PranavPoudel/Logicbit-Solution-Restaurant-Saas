// components/owner-reservations/reservation-form-modal.tsx
"use client";

import { X, Calendar, Clock, Users, Phone, Mail, MessageSquare } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { tablesApi } from "@/lib/api/tables";

interface ReservationFormModalProps {
  restaurantId: string;
  editingRes: any | null;
  saveMutation: any;
  closeModal: () => void;
  formData: {
    customerName: string;
    customerPhone: string;
    partySize: string;
    reservationDate: string;
    reservationTime: string;
    durationMinutes: string;
    tableId: string;
    status: string;
    notes: string;
  };
  setFormData: (data: any) => void;
}

export function ReservationFormModal({
  restaurantId,
  editingRes,
  saveMutation,
  closeModal,
  formData,
  setFormData,
}: ReservationFormModalProps) {
  const tablesQuery = useQuery({
    queryKey: ["owner-tables", restaurantId],
    queryFn: () => tablesApi.list(restaurantId, false),
  });
  const tables = tablesQuery.data ?? [];

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={closeModal}>
      <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-neutral-100 sticky top-0 bg-white">
          <h3 className="text-lg font-semibold text-neutral-900">
            {editingRes ? "Edit Reservation" : "New Reservation"}
          </h3>
          <button onClick={closeModal}><X size={20} className="text-neutral-400" /></button>
        </div>
        
        <div className="p-6 space-y-4">
          {/* Customer Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-600 mb-1">Customer Name</label>
              <div className="relative">
                <Users size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  placeholder="John Doe"
                  className="w-full border border-neutral-200 rounded-lg pl-10 pr-3 py-2 text-sm focus:ring-2 focus:ring-[#E3A008]/20 focus:border-[#E3A008] outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-600 mb-1">Phone</label>
              <div className="relative">
                <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  value={formData.customerPhone}
                  onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                  placeholder="+977 98XXXXXXXX"
                  className="w-full border border-neutral-200 rounded-lg pl-10 pr-3 py-2 text-sm focus:ring-2 focus:ring-[#E3A008]/20 focus:border-[#E3A008] outline-none"
                />
              </div>
            </div>
          </div>

          {/* Reservation Details */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-600 mb-1">Date *</label>
              <div className="relative">
                <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="date"
                  value={formData.reservationDate}
                  onChange={(e) => setFormData({ ...formData, reservationDate: e.target.value })}
                  className="w-full border border-neutral-200 rounded-lg pl-10 pr-3 py-2 text-sm focus:ring-2 focus:ring-[#E3A008]/20 focus:border-[#E3A008] outline-none"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-600 mb-1">Time *</label>
              <div className="relative">
                <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="time"
                  value={formData.reservationTime}
                  onChange={(e) => setFormData({ ...formData, reservationTime: e.target.value })}
                  className="w-full border border-neutral-200 rounded-lg pl-10 pr-3 py-2 text-sm focus:ring-2 focus:ring-[#E3A008]/20 focus:border-[#E3A008] outline-none"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-600 mb-1">Party Size *</label>
              <div className="relative">
                <Users size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="number"
                  min="1"
                  value={formData.partySize}
                  onChange={(e) => setFormData({ ...formData, partySize: e.target.value })}
                  className="w-full border border-neutral-200 rounded-lg pl-10 pr-3 py-2 text-sm focus:ring-2 focus:ring-[#E3A008]/20 focus:border-[#E3A008] outline-none"
                  required
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-600 mb-1">Duration (minutes)</label>
              <input
                type="number"
                value={formData.durationMinutes}
                onChange={(e) => setFormData({ ...formData, durationMinutes: e.target.value })}
                className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#E3A008]/20 focus:border-[#E3A008] outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-600 mb-1">Assign Table</label>
              <select
                value={formData.tableId}
                onChange={(e) => setFormData({ ...formData, tableId: e.target.value })}
                className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#E3A008]/20 focus:border-[#E3A008] outline-none bg-white"
              >
                <option value="">Unassigned</option>
                {tables.map((table: any) => (
                  <option key={table.id} value={table.id}>
                    {table.name} (Capacity: {table.capacity})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-600 mb-1">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#E3A008]/20 focus:border-[#E3A008] outline-none bg-white"
            >
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="SEATED">Seated</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="NO_SHOW">No Show</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-600 mb-1">Notes</label>
            <div className="relative">
              <MessageSquare size={16} className="absolute left-3 top-3 text-neutral-400" />
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Special requests, dietary restrictions, etc."
                rows={3}
                className="w-full border border-neutral-200 rounded-lg pl-10 pr-3 py-2 text-sm focus:ring-2 focus:ring-[#E3A008]/20 focus:border-[#E3A008] outline-none resize-none"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 p-6 border-t border-neutral-100 bg-neutral-50 sticky bottom-0">
          <button onClick={closeModal} className="px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-200 rounded-lg">
            Cancel
          </button>
          <button
            onClick={() => {
              saveMutation.mutate({
                customerName: formData.customerName || undefined,
                customerPhone: formData.customerPhone || undefined,
                partySize: Number(formData.partySize),
                reservationDate: formData.reservationDate,
                reservationTime: formData.reservationTime,
                durationMinutes: Number(formData.durationMinutes),
                tableId: formData.tableId || undefined,
                status: formData.status,
                notes: formData.notes || undefined,
              });
            }}
            disabled={saveMutation.isPending || !formData.reservationDate || !formData.reservationTime || !formData.partySize}
            className="px-4 py-2 text-sm font-medium bg-[#1B2333] text-white rounded-lg hover:bg-[#1B2333]/90 disabled:opacity-50"
          >
            {saveMutation.isPending ? "Saving..." : editingRes ? "Update Reservation" : "Create Reservation"}
          </button>
        </div>
      </div>
    </div>
  );
}