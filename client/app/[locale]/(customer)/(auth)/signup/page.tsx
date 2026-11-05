// app/(customer)/signup/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { isAxiosError } from "axios";
import { customerSignupSchema, type CustomerSignupInput } from "@/lib/validation/auth-schemas";
import { customerSignup } from "@/lib/api/customer-auth";
import { postLoginPath } from "@/lib/utils/redirect";
import { playSound } from "@/lib/utils/sound";
import { useCustomerAuthStore } from "@/store/customer-auth-store";
import { AuthError, AuthInput, AuthPassword, AuthSubmit, PasswordStrength } from "@/components/auth/auth-shell";

export default function CustomerSignupPage() {
  const t = useTranslations("auth");
  const router = useRouter();
  const setAuth = useCustomerAuthStore((s) => s.setAuth);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CustomerSignupInput>({
    resolver: zodResolver(customerSignupSchema),
  });

  const mutation = useMutation({
    mutationFn: (input: CustomerSignupInput) => {
      return customerSignup({ fullName: input.fullName, email: input.email, phone: input.phone, password: input.password });
    },
    onSuccess: (data) => {
      playSound("success");
      setAuth(data);
      router.push(postLoginPath());
    },
    onError: () => playSound("error"),
  });

  const password = useWatch({ control, name: "password" });

  const onSubmit = (input: CustomerSignupInput) => mutation.mutate(input);

  const errorMessage = isAxiosError(mutation.error)
    ? mutation.error.response?.data?.message ?? t("signupFailed")
    : mutation.isError
      ? t("signupFailed")
      : null;

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {errorMessage && <AuthError>{typeof errorMessage === "string" ? errorMessage : t("signupFailed")}</AuthError>}
      <AuthInput id="fullName" label={t("fullName")} icon="user" autoComplete="name" placeholder="Sita Rai" error={errors.fullName?.message && t(errors.fullName.message)} {...register("fullName")} />
      <AuthInput id="email" label={t("email")} icon="mail" type="email" autoComplete="email" placeholder="you@example.com" error={errors.email?.message && t(errors.email.message)} {...register("email")} />
      <AuthInput id="phone" label={t("mobile")} icon="phone" type="tel" autoComplete="tel" placeholder="98XXXXXXXX" error={errors.phone?.message && t(errors.phone.message)} {...register("phone")} />
      <AuthPassword id="password" label={t("password")} autoComplete="new-password" error={errors.password?.message && t(errors.password.message)} hint={<PasswordStrength value={password ?? ""} />} {...register("password")} />
      <AuthPassword id="confirmPassword" label={t("confirmPassword")} autoComplete="new-password" error={errors.confirmPassword?.message && t(errors.confirmPassword.message)} {...register("confirmPassword")} />
      <AuthSubmit pending={mutation.isPending} pendingLabel={t("creating")}>{t("createAccount")}</AuthSubmit>
    </form>
  );
}
