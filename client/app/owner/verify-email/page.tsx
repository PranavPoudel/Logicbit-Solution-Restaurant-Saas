// app/owner/verify-email/page.tsx
"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { ownerVerifyEmailSchema, type OwnerVerifyEmailInput } from "@/lib/validation/auth-schemas";
import { ownerResendVerification, ownerVerifyEmail } from "@/lib/api/owner-auth";
import { authErrorInfo } from "@/lib/utils/auth-error";
import { useCooldown } from "@/hooks/use-cooldown";
import { FormField } from "@/components/ui/form-field";
import { OwnerAuthCard, OwnerAuthError, OwnerAuthNotice, ownerButtonClass, ownerLinkClass } from "@/components/auth/owner-auth-card";

export default function OwnerVerifyEmailPage({ searchParams }: { searchParams: Promise<{ email?: string }> }) {
  const { email: emailParam = "" } = use(searchParams);
  const router = useRouter();
  const [resent, setResent] = useState(false);
  const cooldown = useCooldown(60);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<OwnerVerifyEmailInput>({ resolver: zodResolver(ownerVerifyEmailSchema), defaultValues: { email: emailParam, code: "" } });

  const verify = useMutation({
    mutationFn: ownerVerifyEmail,
    onSuccess: () => router.push("/owner/login?verified=1"),
  });

  const resend = useMutation({
    mutationFn: () => ownerResendVerification(getValues("email")),
    onSuccess: () => {
      setResent(true);
      cooldown.start();
    },
  });

  const errorMessage = verify.isError
    ? authErrorInfo(verify.error).status === 429
      ? "Too many attempts. Please wait a minute and try again."
      : "That code is wrong or has expired."
    : null;

  return (
    <OwnerAuthCard title="Check your inbox" subtitle="We sent a 6-digit code to confirm your email address.">
      <form noValidate onSubmit={handleSubmit((input) => verify.mutate(input))} className="space-y-4">
        {resent && <OwnerAuthNotice>If the account exists, a new code is on its way.</OwnerAuthNotice>}
        <FormField label="Email" type="email" autoComplete="email" placeholder="owner@test.com" error={errors.email?.message} {...register("email")} />
        <FormField label="6-digit code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="123456" error={errors.code?.message} {...register("code")} />
        {errorMessage && <OwnerAuthError>{errorMessage}</OwnerAuthError>}
        <button type="submit" disabled={verify.isPending} className={ownerButtonClass}>
          {verify.isPending ? "Confirming…" : "Confirm email"}
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
