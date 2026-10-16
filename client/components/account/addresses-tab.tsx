// components/account/addresses-tab.tsx
"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { addressesApi } from "@/lib/api/customers";
import { useGeolocation } from "@/hooks/use-geolocation";
import { getErrorMessage } from "@/lib/utils/error";
import { Button, Icon, IconButton } from "@/components/ui/primitives";
import { AuthInput } from "@/components/auth/auth-shell";
import { Empty } from "@/components/account/empty";
import { AddressPicker, type AddressValue } from "@/components/map/address-picker";

interface AddressRow {
  id: string;
  label?: string;
  fullAddress?: string;
}

const EMPTY_ADDRESS: AddressValue = { address: "", lat: null, lng: null };

export function AddressesTab() {
  const t = useTranslations("account");
  const tc = useTranslations("common");
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
  const error = pickerError || (addMutation.isError ? getErrorMessage(addMutation.error, t("addressSaveError")) : "");

  return (
    <div className="animate-fade-up max-w-3xl space-y-3 pb-5">
      {isLoading ? (
        <p className="text-lg text-ink/70">{t("loadingAddresses")}</p>
      ) : addresses.length === 0 ? (
        <Empty>{t("noAddresses")}</Empty>
      ) : (
        addresses.map((addr) => (
          <div key={addr.id} className="flex items-start justify-between gap-3 rounded-[24px] bg-paper p-4 shadow-soft md:p-5">
            <div className="flex items-start gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-saffron text-espresso"><Icon name="pin" /></span>
              <div>
                <p className="font-display text-xl font-extrabold">{addr.label ?? t("addressFallback")}</p>
                <p className="mt-0.5 text-ink/75">{addr.fullAddress}</p>
              </div>
            </div>
            <IconButton icon="trash" label={t("deleteAddress")} onClick={() => deleteMutation.mutate(addr.id)} className="text-chili hover:bg-chili/10" />
          </div>
        ))
      )}

      {showForm ? (
        <div className="space-y-4 rounded-[28px] bg-paper p-4 shadow-warm md:p-6">
          <AuthInput id="address-label" label={t("label")} icon="bag" value={label} onChange={(e) => setLabel(e.target.value)} placeholder={t("labelPlaceholder")} />
          <AddressPicker
            value={location}
            onChange={(next) => {
              setLocation(next);
              setPickerError("");
            }}
            onError={setPickerError}
            placeholder={t("fullAddress")}
            mapLabel={t("pinAddress")}
            startLat={startLat}
            startLng={startLng}
          />
          {error && (
            <p role="alert" className="flex items-center gap-1.5 font-medium text-danger">
              <Icon name="alert" className="h-4 w-4" />{error}
            </p>
          )}
          <div className="flex gap-2">
            <Button onClick={() => addMutation.mutate()} disabled={!canSave || addMutation.isPending}>
              {addMutation.isPending ? t("saving") : t("saveAddress")}
            </Button>
            <Button variant="ghost" onClick={closeForm}>{tc("cancel")}</Button>
          </div>
        </div>
      ) : (
        <Button variant="outline" onClick={() => setShowForm(true)}>
          <Icon name="plus" className="h-5 w-5" />{t("addAddress")}
        </Button>
      )}
    </div>
  );
}
