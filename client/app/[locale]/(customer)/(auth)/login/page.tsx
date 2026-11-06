// app/(customer)/login/page.tsx
"use client";

import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { isAxiosError } from "axios";
import { customerLoginSchema, type CustomerLoginInput } from "@/lib/validation/auth-schemas";
import { customerLogin, customerResendVerification } from "@/lib/api/customer-auth";
import { authErrorInfo } from "@/lib/utils/auth-error";
import { startGoogleLogin } from "@/lib/utils/google-login";
import { postLoginPath } from "@/lib/utils/redirect";
import { playSound } from "@/lib/utils/sound";
import { useCustomerAuthStore } from "@/store/customer-auth-store";
import { AuthError, AuthInput, AuthNotice, AuthPassword, AuthSubmit, GoogleButton, OrDivider } from "@/components/auth/auth-shell";

export default function CustomerLoginPage({ searchParams }: { searchParams: Promise<{ verified?: string; reset?: string }> }) {
  const { verified, reset } = use(searchParams);
  const t = useTranslations("auth");
  const locale = useLocale();
  const router = useRouter();
  const setAuth = useCustomerAuthStore((s) => s.setAuth);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CustomerLoginInput>({
    resolver: zodResolver(customerLoginSchema),
  });

  const mutation = useMutation({
    mutationFn: customerLogin,
    onSuccess: (data) => {
      playSound("success");
      setAuth(data);
      router.push(postLoginPath());
    },
    onError: (error, input) => {
      playSound("error");
      // An account that has not confirmed its email yet is sent to enter the code, with a fresh one on its way.
      if (authErrorInfo(error).code === "EMAIL_NOT_VERIFIED") {
        void customerResendVerification(input.email).catch(() => undefined);
        router.push(`/verify-email?email=${encodeURIComponent(input.email)}`);
      }
    },
  });

  const onSubmit = (input: CustomerLoginInput) => mutation.mutate(input);

  const errorMessage = isAxiosError(mutation.error)
    ? mutation.error.response?.data?.message ?? t("loginFailed")
    : mutation.isError
      ? t("loginFailed")
      : null;

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {verified && <AuthNotice>{t("verifiedNotice")}</AuthNotice>}
      {reset && <AuthNotice>{t("resetNotice")}</AuthNotice>}
      {errorMessage && <AuthError>{typeof errorMessage === "string" ? errorMessage : t("loginFailed")}</AuthError>}
      <AuthInput id="email" label={t("email")} icon="mail" type="email" autoComplete="email" placeholder="you@example.com" error={errors.email?.message && t(errors.email.message)} {...register("email")} />
      <AuthPassword id="password" label={t("password")} autoComplete="current-password" error={errors.password?.message && t(errors.password.message)} {...register("password")} />
      <div className="-mt-2 flex justify-end">
        <Link href="/forgot-password" className="inline-flex min-h-11 items-center font-bold text-chili underline underline-offset-4">
          {t("forgotLink")}
        </Link>
      </div>
      <AuthSubmit pending={mutation.isPending} pendingLabel={t("loggingIn")}>{t("logIn")}</AuthSubmit>
      <OrDivider />
      <GoogleButton onClick={() => startGoogleLogin(locale)}>{t("google")}</GoogleButton>
    </form>
  );
}
