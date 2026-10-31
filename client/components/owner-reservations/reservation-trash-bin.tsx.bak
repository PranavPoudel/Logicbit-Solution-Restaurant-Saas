// components/owner-reservations/reservation-trash-bin.tsx
"use client";

import { useMutation, type QueryClient } from "@tanstack/react-query";
import { RotateCcw, Trash2, AlertTriangle, Calendar, Users, Clock } from "lucide-react";
import { reservationsApi, type Reservation } from "@/lib/api/reservations";

interface ReservationTrashBinProps {
  reservations: Reservation[];
  restaurantId: string;
  queryClient: QueryClient;
}

export function ReservationTrashBin({ reservations, restaurantId, queryClient }: ReservationTrashBinProps) {
  const restoreMutation = useMutation({
    mutationFn: (id: string) => reservationsApi.restore(restaurantId, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["owner-reservations", restaurantId] }),
  });

  const permDeleteMutation = useMutation({
    mutationFn: (id: string) => reservationsApi.permanentDelete(restaurantId, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["owner-reservations", restaurantId] }),
  });

  return (
    <div className="space-y-4">
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-red-700">Trash Bin</p>
          <p className="text-xs text-red-600 mt-0.5">
            Cancelled reservations are kept here for 30 days before permanent deletion. Restore them to bring them back, or delete them permanently.
          </p>
        </div>
      </div>

      {reservations.length === 0 ? (
        <div className="bg-white border border-neutral-200 rounded-xl p-10 text-center">
          <Calendar className="mx-auto text-neutral-300 mb-3" size={32} />
          <p className="text-sm text-neutral-500">Trash is empty.</p>
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
                  <th className="text-left text-xs font-semibold text-neutral-600 px-4 py-3">Cancelled</th>
                  <th className="text-right text-xs font-semibold text-neutral-600 px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {reservations.map((res) => (
                  <tr key={res.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-neutral-900">{res.customerName || "Walk-in"}</p>
                      {res.customerPhone && <p className="text-xs text-neutral-500">{res.customerPhone}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-neutral-700">{new Date(res.reservationDate).toLocaleDateString()}</p>
                      <p className="text-xs text-neutral-500 flex items-center gap-1">
                        <Clock size={10} /> {res.reservationTime}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-sm text-neutral-700">
                        <Users size={14} className="text-neutral-400" /> {res.partySize}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-neutral-500">
                        {res.deletedAt ? new Date(res.deletedAt).toLocaleDateString() : "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => restoreMutation.mutate(res.id)}
                          disabled={restoreMutation.isPending}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors disabled:opacity-50"
                        >
                          <RotateCcw size={12} /> Restore
                        </button>
                        <button
                          onClick={() => permDeleteMutation.mutate(res.id)}
                          disabled={permDeleteMutation.isPending}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                        >
                          <Trash2 size={12} /> Delete Forever
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}