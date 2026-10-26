// app/(customer)/login/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { isAxiosError } from "axios";
import { customerLoginSchema, type CustomerLoginInput } from "@/lib/validation/auth-schemas";
import { customerLogin } from "@/lib/api/customer-auth";
import { postLoginPath } from "@/lib/utils/redirect";
import { useCustomerAuthStore } from "@/store/customer-auth-store";
import { AuthError, AuthInput, AuthPassword, AuthSubmit } from "@/components/auth/auth-shell";

export default function CustomerLoginPage() {
  const t = useTranslations("auth");
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
      setAuth(data);
      router.push(postLoginPath());
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
      {errorMessage && <AuthError>{typeof errorMessage === "string" ? errorMessage : t("loginFailed")}</AuthError>}
      <AuthInput id="email" label={t("email")} icon="mail" type="email" autoComplete="email" placeholder="you@example.com" error={errors.email?.message && t(errors.email.message)} {...register("email")} />
      <AuthPassword id="password" label={t("password")} autoComplete="current-password" error={errors.password?.message && t(errors.password.message)} {...register("password")} />
      <AuthSubmit pending={mutation.isPending} pendingLabel={t("loggingIn")}>{t("logIn")}</AuthSubmit>
    </form>
  );
}
