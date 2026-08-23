// components/account/addresses-tab.tsx
"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, MapPin } from "lucide-react";
import { addressesApi } from "@/lib/api/customers";
import { useGeolocation } from "@/hooks/use-geolocation";

interface AddressRow {
  id: string;
  label?: string;
  addressLine?: string;
}

export function AddressesTab() {
  const queryClient = useQueryClient();
  const { lat, lng } = useGeolocation();
  const [showForm, setShowForm] = useState(false);
  const [label, setLabel] = useState("");
  const [addressLine, setAddressLine] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["my-addresses"],
    queryFn: () => addressesApi.list() as Promise<AddressRow[]>,
  });

  const addMutation = useMutation({
    mutationFn: () => addressesApi.create({ label, addressLine, lat, lng }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-addresses"] });
      setLabel("");
      setAddressLine("");
      setShowForm(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => addressesApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["my-addresses"] }),
  });

  const addresses = data ?? [];

  return (
    <div className="max-w-md py-5 space-y-3">
      {isLoading ? (
        <p className="text-sm text-neutral-400">Loading addresses…</p>
      ) : addresses.length === 0 ? (
        <p className="text-sm text-neutral-400">No saved addresses yet.</p>
      ) : (
        addresses.map((addr) => (
          <div
            key={addr.id}
            className="flex items-start justify-between gap-3 bg-white border border-[#E8E7E2] rounded-xl p-3.5"
          >
            <div className="flex items-start gap-2.5">
              <MapPin size={15} className="text-[#E3A008] mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-[#17181C]">{addr.label ?? "Address"}</p>
                <p className="text-xs text-neutral-500 mt-0.5">{addr.addressLine}</p>
              </div>
            </div>
            <button
              onClick={() => deleteMutation.mutate(addr.id)}
              className="text-neutral-300 hover:text-red-500 shrink-0"
              aria-label="Delete address"
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))
      )}

      {showForm ? (
        <div className="bg-white border border-[#E8E7E2] rounded-xl p-3.5 space-y-2">
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Label (e.g. Home, Office)"
            className="w-full text-sm border border-[#E8E7E2] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#E3A008]/40"
          />
          <textarea
            value={addressLine}
            onChange={(e) => setAddressLine(e.target.value)}
            placeholder="Full address"
            rows={2}
            className="w-full text-sm border border-[#E8E7E2] rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-[#E3A008]/40"
          />
          <div className="flex gap-2">
            <button
              onClick={() => addressLine && addMutation.mutate()}
              disabled={addMutation.isPending}
              className="text-xs font-medium bg-[#17181C] text-white px-3.5 py-2 rounded-lg disabled:opacity-50"
            >
              {addMutation.isPending ? "Saving…" : "Save address"}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="text-xs text-neutral-500 px-3.5 py-2"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 text-sm font-medium text-[#17181C]"
        >
          <Plus size={15} />
          Add new address
        </button>
      )}
    </div>
  );
}
