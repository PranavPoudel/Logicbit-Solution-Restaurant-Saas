// components/account/profile-tab.tsx
"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle2 } from "lucide-react";
import { useCustomerAuthStore } from "@/store/customer-auth-store";
import { updateMyProfile } from "@/lib/api/customers";
import { FormField } from "@/components/ui/form-field";

export function ProfileTab() {
  const customer = useCustomerAuthStore((s) => s.customer);
  const [fullName, setFullName] = useState(customer?.fullName ?? "");
  const [phone, setPhone] = useState(customer?.phone ?? "");
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const mutation = useMutation({
    mutationFn: () => updateMyProfile({ fullName, phone }),
    onSuccess: () => setSavedAt(Date.now()),
  });

  return (
    <div className="max-w-sm space-y-4 py-5">
      <FormField label="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
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
        {savedAt && (
          <span className="flex items-center gap-1 text-xs text-[#0F6B5C]">
            <CheckCircle2 size={13} />
            Saved
          </span>
        )}
      </div>
    </div>
  );
}
