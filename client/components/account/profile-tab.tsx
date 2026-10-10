// components/account/profile-tab.tsx
"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle2 } from "lucide-react";
import { useCustomerAuthStore } from "@/store/customer-auth-store";
import { updateMyProfile } from "@/lib/api/customers";
import { getErrorMessage } from "@/lib/utils/error";
import { FormField } from "@/components/ui/form-field";

export function ProfileTab() {
  const customer = useCustomerAuthStore((s) => s.customer);
  const setCustomer = useCustomerAuthStore((s) => s.setCustomer);
  const [name, setName] = useState(customer?.name ?? "");
  const [phone, setPhone] = useState(customer?.phone ?? "");

  const mutation = useMutation({
    mutationFn: () => updateMyProfile({ name, phone }),
    onSuccess: setCustomer,
  });

  return (
    <div className="max-w-sm space-y-4 py-5">
      <FormField label="Full name" value={name} onChange={(e) => setName(e.target.value)} />
      <FormField
        label="Email"
        value={customer?.email ?? ""}
        disabled
        className="opacity-60"
      />
      <FormField label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />

      <div className="flex items-center gap-3">
        <button
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
          className="text-sm font-medium bg-[#17181C] text-white px-4 py-2.5 rounded-xl disabled:opacity-50"
        >
          {mutation.isPending ? "Saving…" : "Save changes"}
        </button>
        {mutation.isError && (
          <span className="text-xs text-red-600">
            {getErrorMessage(mutation.error, "Couldn't save your changes. Please try again.")}
          </span>
        )}
        {mutation.isSuccess && (
          <span className="flex items-center gap-1 text-xs text-[#0F6B5C]">
            <CheckCircle2 size={13} />
            Saved
          </span>
        )}
      </div>
    </div>
  );
}
