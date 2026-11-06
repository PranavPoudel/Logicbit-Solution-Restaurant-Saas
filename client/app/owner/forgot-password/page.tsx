// app/owner/forgot-password/page.tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { ownerForgotPasswordSchema, type OwnerForgotPasswordInput } from "@/lib/validation/auth-schemas";
import { ownerForgotPassword } from "@/lib/api/owner-auth";
import { authErrorInfo } from "@/lib/utils/auth-error";
import { FormField } from "@/components/ui/form-field";
import { OwnerAuthCard, OwnerAuthError, ownerButtonClass, ownerLinkClass } from "@/components/auth/owner-auth-card";

export default function OwnerForgotPasswordPage() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OwnerForgotPasswordInput>({ resolver: zodResolver(ownerForgotPasswordSchema) });

  const mutation = useMutation({
    mutationFn: (input: OwnerForgotPasswordInput) => ownerForgotPassword(input.email),
    // The answer is the same whether or not the account exists, so go straight to entering the code.
    onSuccess: (_data, input) => router.push(`/owner/reset-password?email=${encodeURIComponent(input.email)}`),
  });

  const errorMessage = mutation.isError
    ? authErrorInfo(mutation.error).status === 429
      ? "Too many attempts. Please wait a minute and try again."
      : "We could not send the code. Please try again."
    : null;

  return (
    <OwnerAuthCard title="Forgot your password?" subtitle="Enter your email and we will send you a 6-digit code.">
      <form noValidate onSubmit={handleSubmit((input) => mutation.mutate(input))} className="space-y-4">
        <FormField label="Email" type="email" autoComplete="email" placeholder="owner@test.com" error={errors.email?.message} {...register("email")} />
        {errorMessage && <OwnerAuthError>{errorMessage}</OwnerAuthError>}
        <button type="submit" disabled={mutation.isPending} className={ownerButtonClass}>
          {mutation.isPending ? "Sending…" : "Send code"}
        </button>
        <p className="text-center">
          <Link href="/owner/login" className={ownerLinkClass}>Back to log in</Link>
        </p>
      </form>
    </OwnerAuthCard>
  );
}
