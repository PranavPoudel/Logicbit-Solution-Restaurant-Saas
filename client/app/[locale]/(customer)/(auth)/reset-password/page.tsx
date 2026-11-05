// app/(customer)/(auth)/reset-password/page.tsx
"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { resetPasswordSchema, type ResetPasswordInput } from "@/lib/validation/auth-schemas";
import { customerForgotPassword, customerResetPassword } from "@/lib/api/customer-auth";
import { authErrorInfo } from "@/lib/utils/auth-error";
import { playSound } from "@/lib/utils/sound";
import { useCooldown } from "@/hooks/use-cooldown";
import { AuthError, AuthInput, AuthNotice, AuthPassword, AuthSubmit, PasswordStrength } from "@/components/auth/auth-shell";

export default function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ email?: string }> }) {
  const { email: emailParam = "" } = use(searchParams);
  const t = useTranslations("auth");
  const router = useRouter();
  const [resent, setResent] = useState(false);
  const cooldown = useCooldown(60);

  const {
    register,
    handleSubmit,
    control,
    getValues,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { email: emailParam, code: "", newPassword: "", confirmPassword: "" },
  });

  const reset = useMutation({
    mutationFn: (input: ResetPasswordInput) => customerResetPassword({ email: input.email, code: input.code, newPassword: input.newPassword }),
    onSuccess: () => {
      playSound("success");
      router.push("/login?reset=1");
    },
    onError: () => playSound("error"),
  });

  const resend = useMutation({
    mutationFn: () => customerForgotPassword(getValues("email")),
    onSuccess: () => {
      setResent(true);
      cooldown.start();
    },
  });

  const newPassword = useWatch({ control, name: "newPassword" });
  const info = authErrorInfo(reset.error);
  const errorMessage = reset.isError ? (info.status === 429 ? t("tooManyAttempts") : t("resetFailed")) : null;

  return (
    <form noValidate onSubmit={handleSubmit((input) => reset.mutate(input))} className="space-y-5">
      {errorMessage && <AuthError>{errorMessage}</AuthError>}
      {resent && <AuthNotice>{t("resent")}</AuthNotice>}
      <AuthInput id="email" label={t("email")} icon="mail" type="email" autoComplete="email" placeholder="you@example.com" error={errors.email?.message && t(errors.email.message)} {...register("email")} />
      <AuthInput
        id="code"
        label={t("code")}
        icon="lock"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        placeholder="123456"
        error={errors.code?.message && t(errors.code.message)}
        hint={<p className="mt-2 text-ink/65">{t("codeHint")}</p>}
        {...register("code")}
      />
      <AuthPassword
        id="newPassword"
        label={t("newPassword")}
        autoComplete="new-password"
        error={errors.newPassword?.message && t(errors.newPassword.message)}
        hint={<PasswordStrength value={newPassword ?? ""} min={8} />}
        {...register("newPassword")}
      />
      <AuthPassword id="confirmPassword" label={t("confirmPassword")} autoComplete="new-password" error={errors.confirmPassword?.message && t(errors.confirmPassword.message)} {...register("confirmPassword")} />
      <AuthSubmit pending={reset.isPending} pendingLabel={t("saving")}>{t("setPassword")}</AuthSubmit>

      <button
        type="button"
        onClick={() => resend.mutate()}
        disabled={resend.isPending || cooldown.remaining > 0}
        className="inline-flex min-h-11 items-center font-bold text-chili underline underline-offset-4 disabled:cursor-not-allowed disabled:text-ink/45 disabled:no-underline"
      >
        {cooldown.remaining > 0 ? t("resendIn", { seconds: cooldown.remaining }) : t("resend")}
      </button>
    </form>
  );
}
