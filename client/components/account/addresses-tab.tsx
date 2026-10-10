// components/account/addresses-tab.tsx
"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, MapPin } from "lucide-react";
import { addressesApi } from "@/lib/api/customers";
import { useGeolocation } from "@/hooks/use-geolocation";
import { getErrorMessage } from "@/lib/utils/error";
import { AddressPicker, type AddressValue } from "@/components/map/address-picker";

interface AddressRow {
  id: string;
  label?: string;
  fullAddress?: string;
}

const EMPTY_ADDRESS: AddressValue = { address: "", lat: null, lng: null };

export function AddressesTab() {
  const queryClient = useQueryClient();
  const { lat: startLat, lng: startLng } = useGeolocation();
  const [showForm, setShowForm] = useState(false);
  const [label, setLabel] = useState("");
  const [location, setLocation] = useState(EMPTY_ADDRESS);
  const [pickerError, setPickerError] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["my-addresses"],
    queryFn: () => addressesApi.list() as Promise<AddressRow[]>,
  });

  const closeForm = () => {
    setLabel("");
    setLocation(EMPTY_ADDRESS);
    setPickerError("");
    setShowForm(false);
  };

  const addMutation = useMutation({
    mutationFn: () =>
      addressesApi.create({
        label: label.trim(),
        fullAddress: location.address.trim(),
        latitude: location.lat as number,
        longitude: location.lng as number,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-addresses"] });
      closeForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => addressesApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["my-addresses"] }),
  });

  const addresses = data ?? [];
  const canSave = !!label.trim() && !!location.address.trim() && location.lat != null && location.lng != null;
  const error = pickerError || (addMutation.isError ? getErrorMessage(addMutation.error, "Couldn't save this address.") : "");

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
                <p className="text-xs text-neutral-500 mt-0.5">{addr.fullAddress}</p>
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
        <div className="bg-white border border-[#E8E7E2] rounded-xl p-3.5 space-y-3">
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Label (e.g. Home, Office)"
            className="w-full text-sm border border-[#E8E7E2] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#E3A008]/40"
          />
          <AddressPicker
            value={location}
            onChange={(next) => {
              setLocation(next);
              setPickerError("");
            }}
            onError={setPickerError}
            placeholder="Full address"
            mapLabel="Pin the address on the map"
            startLat={startLat}
            startLng={startLng}
          />
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={() => addMutation.mutate()}
              disabled={!canSave || addMutation.isPending}
              className="text-xs font-medium bg-[#17181C] text-white px-3.5 py-2 rounded-lg disabled:opacity-50"
            >
              {addMutation.isPending ? "Saving…" : "Save address"}
            </button>
            <button onClick={closeForm} className="text-xs text-neutral-500 px-3.5 py-2">
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
