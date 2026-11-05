// app/(customer)/(auth)/verify-email/page.tsx
"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { verifyEmailSchema, type VerifyEmailInput } from "@/lib/validation/auth-schemas";
import { customerResendVerification, customerVerifyEmail } from "@/lib/api/customer-auth";
import { authErrorInfo } from "@/lib/utils/auth-error";
import { postLoginPath } from "@/lib/utils/redirect";
import { playSound } from "@/lib/utils/sound";
import { useCooldown } from "@/hooks/use-cooldown";
import { useCustomerAuthStore } from "@/store/customer-auth-store";
import { AuthError, AuthInput, AuthNotice, AuthSubmit } from "@/components/auth/auth-shell";

export default function VerifyEmailPage({ searchParams }: { searchParams: Promise<{ email?: string }> }) {
  const { email: emailParam = "" } = use(searchParams);
  const t = useTranslations("auth");
  const router = useRouter();
  const isAuthenticated = useCustomerAuthStore((s) => s.isAuthenticated);
  const [resent, setResent] = useState(false);
  const cooldown = useCooldown(60);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<VerifyEmailInput>({ resolver: zodResolver(verifyEmailSchema), defaultValues: { email: emailParam, code: "" } });

  const verify = useMutation({
    mutationFn: customerVerifyEmail,
    onSuccess: () => {
      playSound("success");
      // Someone who is already logged in carries on; otherwise they log in now that the email is confirmed.
      router.push(isAuthenticated ? postLoginPath() : "/login?verified=1");
    },
    onError: () => playSound("error"),
  });

  const resend = useMutation({
    mutationFn: () => customerResendVerification(getValues("email")),
    onSuccess: () => {
      setResent(true);
      cooldown.start();
    },
  });

  const info = authErrorInfo(verify.error);
  const errorMessage = verify.isError ? (info.status === 429 ? t("tooManyAttempts") : t("verifyFailed")) : null;

  return (
    <form noValidate onSubmit={handleSubmit((input) => verify.mutate(input))} className="space-y-5">
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
      <AuthSubmit pending={verify.isPending} pendingLabel={t("verifying")}>{t("verify")}</AuthSubmit>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => resend.mutate()}
          disabled={resend.isPending || cooldown.remaining > 0}
          className="inline-flex min-h-11 items-center font-bold text-chili underline underline-offset-4 disabled:cursor-not-allowed disabled:text-ink/45 disabled:no-underline"
        >
          {cooldown.remaining > 0 ? t("resendIn", { seconds: cooldown.remaining }) : t("resend")}
        </button>
        {isAuthenticated && (
          <Link href={postLoginPath()} className="inline-flex min-h-11 items-center font-bold text-ink/70 underline underline-offset-4">
            {t("skipForNow")}
          </Link>
        )}
      </div>
    </form>
  );
}
