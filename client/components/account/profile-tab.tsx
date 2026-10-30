// components/account/profile-tab.tsx
"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useCustomerAuthStore } from "@/store/customer-auth-store";
import { updateMyProfile } from "@/lib/api/customers";
import { getErrorMessage } from "@/lib/utils/error";
import { Button, Card, Icon } from "@/components/ui/primitives";
import { AuthInput } from "@/components/auth/auth-shell";

export function ProfileTab() {
  const t = useTranslations("account");
  const customer = useCustomerAuthStore((s) => s.customer);
  const setCustomer = useCustomerAuthStore((s) => s.setCustomer);
  const [name, setName] = useState(customer?.name ?? "");
  const [phone, setPhone] = useState(customer?.phone ?? "");

  const mutation = useMutation({
    mutationFn: () => updateMyProfile({ name, phone }),
    onSuccess: setCustomer,
  });

  return (
    <Card className="animate-fade-up max-w-3xl">
      <div className="grid gap-5 sm:grid-cols-2">
        <AuthInput id="name" label={t("fullName")} icon="user" value={name} onChange={(e) => setName(e.target.value)} />
        <AuthInput id="phone" label={t("phone")} icon="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <div className="sm:col-span-2">
          <AuthInput id="email" label={t("email")} icon="mail" value={customer?.email ?? ""} disabled />
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-4 border-t-2 border-ink/10 pt-6">
        <Button size="lg" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
          {mutation.isPending ? t("saving") : t("save")}
        </Button>
        {mutation.isError && (
          <span role="alert" className="flex items-center gap-1.5 font-medium text-danger">
            <Icon name="alert" className="h-4 w-4" />
            {getErrorMessage(mutation.error, t("saveError"))}
          </span>
        )}
        {mutation.isSuccess && (
          <span role="status" className="flex items-center gap-1.5 font-bold text-herb-ink">
            <Icon name="check" className="h-5 w-5" />
            {t("saved")}
          </span>
        )}
      </div>
    </Card>
  );
}
