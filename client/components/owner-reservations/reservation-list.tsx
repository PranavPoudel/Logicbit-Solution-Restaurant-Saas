// components/owner-reservations/reservation-list.tsx
"use client";

import { useState } from "react";
import { useQuery, useMutation, type QueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Users, Clock, Calendar, X, Phone, MessageSquare, AlertCircle } from "lucide-react";
import { reservationsApi, type Reservation, type CreateReservationDto } from "@/lib/api/reservations";
import { tablesApi } from "@/lib/api/tables";

interface ReservationListProps {
  reservations: Reservation[];
  restaurantId: string;
  queryClient: QueryClient;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  SEATED: "bg-purple-100 text-purple-800",
  COMPLETED: "bg-emerald-100 text-emerald-800",
  CANCELLED: "bg-red-100 text-red-800",
  NO_SHOW: "bg-neutral-100 text-neutral-800",
};

export function ReservationList({ reservations, restaurantId, queryClient }: ReservationListProps) {
  const [showModal, setShowModal] = useState(false);
  const [editingRes, setEditingRes] = useState<Reservation | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Fetch active tables for the dropdown
  const tablesQuery = useQuery({
    queryKey: ["owner-tables", restaurantId],
    queryFn: () => tablesApi.list(restaurantId, false),
  });
  const tables = tablesQuery.data ?? [];

  // Form State
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [partySize, setPartySize] = useState("2");
  const [reservationDate, setReservationDate] = useState(new Date().toISOString().split("T")[0]);
  const [reservationTime, setReservationTime] = useState("12:00");
  const [durationMinutes, setDurationMinutes] = useState("60");
  const [tableId, setTableId] = useState("");
  const [status, setStatus] = useState("PENDING");
  const [notes, setNotes] = useState("");

  const saveMutation = useMutation({
    mutationFn: (dto: CreateReservationDto) =>
      editingRes
        ? reservationsApi.update(restaurantId, editingRes.id, dto)
        : reservationsApi.create(restaurantId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-reservations", restaurantId] });
      closeModal();
    },
    onError: (err: any) => {
      // Extract the exact error message from the backend response
      const message = err?.response?.data?.message || "Failed to save reservation. Please check your inputs and try again.";
      setFormError(Array.isArray(message) ? message.join(", ") : message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => reservationsApi.remove(restaurantId, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["owner-reservations", restaurantId] }),
  });

  function openAdd() {
    setEditingRes(null);
    setFormError(null);
    setCustomerName(""); setCustomerPhone(""); setPartySize("2");
    setReservationDate(new Date().toISOString().split("T")[0]);
    setReservationTime("12:00"); setDurationMinutes("60");
    setTableId(""); setStatus("PENDING"); setNotes("");
    setShowModal(true);
  }

  function openEdit(res: Reservation) {
    setEditingRes(res);
    setFormError(null);
    setCustomerName(res.customerName || "");
    setCustomerPhone(res.customerPhone || "");
    setPartySize(String(res.partySize));
    setReservationDate(res.reservationDate.split("T")[0]);
    setReservationTime(res.reservationTime);
    setDurationMinutes(String(res.durationMinutes));
    setTableId((res.table as any)?.id || "");
    setStatus(res.status);
    setNotes(res.notes || "");
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingRes(null);
    setFormError(null);
  }

  function handleSave() {
    // 1. Client-side validation for required fields
    if (!reservationDate || !reservationTime || !partySize) {
      setFormError("Please fill in all required fields: Date, Time, and Party Size.");
      return;
    }

    // 2. Clear any previous errors before attempting save
    setFormError(null);

    // 3. Construct DTO and send to API
    const dto: CreateReservationDto = {
      customerName: customerName || undefined,
      customerPhone: customerPhone || undefined,
      partySize: Number(partySize),
      reservationDate,
      reservationTime,
      durationMinutes: Number(durationMinutes),
      tableId: tableId || undefined,
      status,
      notes: notes || undefined,
    };
    
    saveMutation.mutate(dto);
  }

  function handleStatusChange(res: Reservation, newStatus: string) {
    setFormError(null);
    const dto: CreateReservationDto = {
      customerName: res.customerName || undefined,
      customerPhone: res.customerPhone || undefined,
      partySize: res.partySize,
      reservationDate: res.reservationDate,
      reservationTime: res.reservationTime,
      durationMinutes: res.durationMinutes,
      tableId: (res.table as any)?.id || undefined,
      status: newStatus,
      notes: res.notes || undefined,
    };
    saveMutation.mutate(dto);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-neutral-900">Reservations ({reservations.length})</h2>
        <button onClick={openAdd} className="flex items-center gap-2 bg-[#E3A008] hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Plus size={16} /> New Reservation
        </button>
      </div>

      {reservations.length === 0 ? (
        <div className="bg-white border border-neutral-200 rounded-xl p-10 text-center">
          <Calendar className="mx-auto text-neutral-300 mb-3" size={32} />
          <p className="text-sm text-neutral-500">No reservations found for this filter.</p>
        </div>
      ) : (
        <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="text-left text-xs font-semibold text-neutral-600 px-4 py-3">Guest</th>
                  <th className="text-left text-xs font-semibold text-neutral-600 px-4 py-3">Date & Time</th>
                  <th className="text-left text-xs font-semibold text-neutral-600 px-4 py-3">Party</th>
                  <th className="text-left text-xs font-semibold text-neutral-600 px-4 py-3">Table</th>
                  <th className="text-left text-xs font-semibold text-neutral-600 px-4 py-3">Status</th>
                  <th className="text-right text-xs font-semibold text-neutral-600 px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {reservations.map((res) => (
                  <tr key={res.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-neutral-900">{res.customerName || "Walk-in"}</p>
                      {res.customerPhone && <p className="text-xs text-neutral-500 flex items-center gap-1"><Phone size={10} /> {res.customerPhone}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-neutral-700">{new Date(res.reservationDate).toLocaleDateString()}</p>
                      <p className="text-xs text-neutral-500 flex items-center gap-1"><Clock size={10} /> {res.reservationTime} ({res.durationMinutes}m)</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-sm text-neutral-700">
                        <Users size={14} className="text-neutral-400" /> {res.partySize}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-neutral-600">{res.table?.name || "Unassigned"}</span>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={res.status}
                        onChange={(e) => handleStatusChange(res, e.target.value)}
                        disabled={saveMutation.isPending}
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border-0 cursor-pointer disabled:opacity-50 ${STATUS_COLORS[res.status] || "bg-neutral-100"}`}
                      >
                        {Object.keys(STATUS_COLORS).map((s) => (
                          <option key={s} value={s}>{s.replace('_', ' ')}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(res)} className="p-1.5 text-neutral-400 hover:text-[#E3A008] hover:bg-amber-50 rounded-lg transition-colors"><Pencil size={14} /></button>
                        <button onClick={() => deleteMutation.mutate(res.id)} className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={closeModal}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-neutral-100 sticky top-0 bg-white z-10">
              <h3 className="text-lg font-semibold text-neutral-900">
                {editingRes ? "Edit Reservation" : "New Reservation"}
              </h3>
              <button onClick={closeModal}><X size={20} className="text-neutral-400 hover:text-neutral-600" /></button>
            </div>
            
            <div className="p-6 space-y-4">
              {/* 🚨 ERROR BANNER 🚨 */}
              {formError && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 flex items-start gap-2">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1">Customer Name</label>
                  <div className="relative">
                    <Users size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
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
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
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
                      value={reservationDate}
                      onChange={(e) => setReservationDate(e.target.value)}
                      className="w-full border border-neutral-200 rounded-lg pl-10 pr-3 py-2 text-sm focus:ring-2 focus:ring-[#E3A008]/20 focus:border-[#E3A008] outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1">Time *</label>
                  <div className="relative">
                    <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input
                      type="time"
                      value={reservationTime}
                      onChange={(e) => setReservationTime(e.target.value)}
                      className="w-full border border-neutral-200 rounded-lg pl-10 pr-3 py-2 text-sm focus:ring-2 focus:ring-[#E3A008]/20 focus:border-[#E3A008] outline-none"
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
                      value={partySize}
                      onChange={(e) => setPartySize(e.target.value)}
                      className="w-full border border-neutral-200 rounded-lg pl-10 pr-3 py-2 text-sm focus:ring-2 focus:ring-[#E3A008]/20 focus:border-[#E3A008] outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1">Duration (minutes)</label>
                  <input
                    type="number"
                    min="15"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(e.target.value)}
                    className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#E3A008]/20 focus:border-[#E3A008] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1">Assign Table</label>
                  <select
                    value={tableId}
                    onChange={(e) => setTableId(e.target.value)}
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
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
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
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Special requests, dietary restrictions, etc."
                    rows={3}
                    className="w-full border border-neutral-200 rounded-lg pl-10 pr-3 py-2 text-sm focus:ring-2 focus:ring-[#E3A008]/20 focus:border-[#E3A008] outline-none resize-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 p-6 border-t border-neutral-100 bg-neutral-50 sticky bottom-0 z-10">
              <button 
                onClick={closeModal} 
                className="px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saveMutation.isPending}
                className="px-6 py-2 text-sm font-medium bg-[#1B2333] text-white rounded-lg hover:bg-[#1B2333]/90 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {saveMutation.isPending && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                {saveMutation.isPending ? "Saving..." : editingRes ? "Update Reservation" : "Create Reservation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}