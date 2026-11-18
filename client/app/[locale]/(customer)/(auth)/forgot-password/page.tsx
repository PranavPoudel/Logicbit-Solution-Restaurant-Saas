// app/(customer)/(auth)/forgot-password/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/lib/validation/auth-schemas";
import { customerForgotPassword } from "@/lib/api/customer-auth";
import { authErrorInfo } from "@/lib/utils/auth-error";
import { AuthError, AuthInput, AuthSubmit } from "@/components/auth/auth-shell";

export default function ForgotPasswordPage() {
  const t = useTranslations("auth");
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({ resolver: zodResolver(forgotPasswordSchema) });

  const mutation = useMutation({
    mutationFn: (input: ForgotPasswordInput) => customerForgotPassword(input.email),
    // The answer is the same whether or not the account exists, so go straight to entering the code.
    onSuccess: (_data, input) => router.push(`/reset-password?email=${encodeURIComponent(input.email)}`),
  });

  const errorMessage = mutation.isError ? (authErrorInfo(mutation.error).status === 429 ? t("tooManyAttempts") : t("forgotFailed")) : null;

  return (
    <form noValidate onSubmit={handleSubmit((input) => mutation.mutate(input))} className="space-y-5">
      {errorMessage && <AuthError>{errorMessage}</AuthError>}
      <AuthInput id="email" label={t("email")} icon="mail" type="email" autoComplete="email" placeholder="you@example.com" error={errors.email?.message && t(errors.email.message)} {...register("email")} />
      <AuthSubmit pending={mutation.isPending} pendingLabel={t("sending")}>{t("sendCode")}</AuthSubmit>
    </form>
  );
}
