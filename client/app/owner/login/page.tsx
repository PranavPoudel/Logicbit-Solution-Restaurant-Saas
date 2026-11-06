// app/owner/login/page.tsx
"use client";

import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { isAxiosError } from "axios";

import {
  ownerLoginSchema,
  type OwnerLoginInput,
} from "@/lib/validation/auth-schemas";
import { ownerLogin, ownerResendVerification } from "@/lib/api/owner-auth";
import { authErrorInfo } from "@/lib/utils/auth-error";
import { OwnerAuthNotice } from "@/components/auth/owner-auth-card";
import { listMyRestaurants } from "@/lib/api/restaurants";
import { useOwnerAuthStore } from "@/store/owner-auth-store";
import { theme } from "@/config/theme";
import { FormField } from "@/components/ui/form-field";

export default function OwnerLoginPage({ searchParams }: { searchParams: Promise<{ verified?: string; reset?: string }> }) {
  const { verified, reset } = use(searchParams);
  const router = useRouter();
  const { setAuth, setRestaurants } = useOwnerAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OwnerLoginInput>({
    resolver: zodResolver(ownerLoginSchema),
  });

  const mutation = useMutation({
    mutationFn: ownerLogin,

    onSuccess: async (data) => {
      setAuth({
        accessToken: data.tokens.accessToken,
        refreshToken: data.tokens.refreshToken,
        user: {
          id: data.user.id,
          fullName: data.user.name,
          email: data.user.email,
          phone: data.user.phone,
          tenantId: data.user.tenantId,
          roles: data.user.roles,
        },
      });

      try {
        const restaurants = await listMyRestaurants();
        setRestaurants(restaurants);
      } catch {
        // Non-fatal. The owner can still enter the dashboard.
      }

      router.push("/owner/dashboard");
    },

    onError: (error, input) => {
      // An account that has not confirmed its email yet is sent to enter the code, with a fresh one on its way.
      if (authErrorInfo(error).code === "EMAIL_NOT_VERIFIED") {
        void ownerResendVerification(input.email).catch(() => undefined);
        router.push(`/owner/verify-email?email=${encodeURIComponent(input.email)}`);
      }
    },
  });

  const onSubmit = (input: OwnerLoginInput) => {
    mutation.mutate(input);
  };

  const errorMessage = isAxiosError(mutation.error)
    ? mutation.error.response?.data?.message ??
      "Login failed. Please try again."
    : mutation.isError
      ? "Login failed. Please try again."
      : null;

  return (
    <div className="min-h-screen bg-[#1B2333] flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl p-8">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-lg bg-[#1B2333] flex items-center justify-center">
            <span className="font-mono text-[#E3A008] text-sm font-bold">
              {theme.brand.name[0]}
            </span>
          </div>

          <span className="font-semibold text-[#1B2333] text-lg">
            {theme.brand.name}
          </span>
        </div>

        <h1 className="text-lg font-semibold text-neutral-900">
          Restaurant owner login
        </h1>

        <p className="text-sm text-neutral-500 mt-1 mb-6">
          Manage your restaurant, orders, and menu.
        </p>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
        >
          {verified && <OwnerAuthNotice>Email confirmed. You can log in now.</OwnerAuthNotice>}
          {reset && <OwnerAuthNotice>Password updated. Log in with your new password.</OwnerAuthNotice>}

          <FormField
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="owner@test.com"
            error={errors.email?.message}
            {...register("email")}
          />

          <FormField
            label="Password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            error={errors.password?.message}
            {...register("password")}
          />

          <p className="text-right -mt-2">
            <Link href="/owner/forgot-password" className="text-sm font-medium text-[#1B2333] underline underline-offset-4">
              Forgot password?
            </Link>
          </p>

          {errorMessage && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {typeof errorMessage === "string"
                ? errorMessage
                : "Login failed. Please try again."}
            </p>
          )}

          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full bg-[#1B2333] text-white text-sm font-medium py-2.5 rounded-xl disabled:opacity-60"
          >
            {mutation.isPending ? "Logging in…" : "Log in"}
          </button>
        </form>
      </div>
    </div>
  );
}