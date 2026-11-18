// app/owner/reset-password/page.tsx
"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { ownerResetPasswordSchema, type OwnerResetPasswordInput } from "@/lib/validation/auth-schemas";
import { ownerForgotPassword, ownerResetPassword } from "@/lib/api/owner-auth";
import { authErrorInfo } from "@/lib/utils/auth-error";
import { useCooldown } from "@/hooks/use-cooldown";
import { FormField } from "@/components/ui/form-field";
import { OwnerAuthCard, OwnerAuthError, OwnerAuthNotice, ownerButtonClass, ownerLinkClass } from "@/components/auth/owner-auth-card";

export default function OwnerResetPasswordPage({ searchParams }: { searchParams: Promise<{ email?: string }> }) {
  const { email: emailParam = "" } = use(searchParams);
  const router = useRouter();
  const [resent, setResent] = useState(false);
  const cooldown = useCooldown(60);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<OwnerResetPasswordInput>({
    resolver: zodResolver(ownerResetPasswordSchema),
    defaultValues: { email: emailParam, code: "", newPassword: "", confirmPassword: "" },
  });

  const reset = useMutation({
    mutationFn: (input: OwnerResetPasswordInput) => ownerResetPassword({ email: input.email, code: input.code, newPassword: input.newPassword }),
    onSuccess: () => router.push("/owner/login?reset=1"),
  });

  const resend = useMutation({
    mutationFn: () => ownerForgotPassword(getValues("email")),
    onSuccess: () => {
      setResent(true);
      cooldown.start();
    },
  });

  const errorMessage = reset.isError
    ? authErrorInfo(reset.error).status === 429
      ? "Too many attempts. Please wait a minute and try again."
      : "That code is wrong or has expired."
    : null;

  return (
    <OwnerAuthCard title="Choose a new password" subtitle="Enter the 6-digit code from your email and a new password.">
      <form noValidate onSubmit={handleSubmit((input) => reset.mutate(input))} className="space-y-4">
        {resent && <OwnerAuthNotice>If the account exists, a new code is on its way.</OwnerAuthNotice>}
        <FormField label="Email" type="email" autoComplete="email" placeholder="owner@test.com" error={errors.email?.message} {...register("email")} />
        <FormField label="6-digit code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="123456" error={errors.code?.message} {...register("code")} />
        <FormField label="New password" type="password" autoComplete="new-password" placeholder="••••••••" error={errors.newPassword?.message} {...register("newPassword")} />
        <FormField label="Confirm password" type="password" autoComplete="new-password" placeholder="••••••••" error={errors.confirmPassword?.message} {...register("confirmPassword")} />
        {errorMessage && <OwnerAuthError>{errorMessage}</OwnerAuthError>}
        <button type="submit" disabled={reset.isPending} className={ownerButtonClass}>
          {reset.isPending ? "Saving…" : "Set new password"}
        </button>
        <div className="flex items-center justify-between">
          <button type="button" onClick={() => resend.mutate()} disabled={resend.isPending || cooldown.remaining > 0} className={`${ownerLinkClass} disabled:opacity-50 disabled:no-underline`}>
            {cooldown.remaining > 0 ? `Send a new code in ${cooldown.remaining}s` : "Send a new code"}
          </button>
          <Link href="/owner/login" className={ownerLinkClass}>Back to log in</Link>
        </div>
      </form>
    </OwnerAuthCard>
  );
}
