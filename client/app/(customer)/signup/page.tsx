// app/(customer)/signup/page.tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { customerSignupSchema, type CustomerSignupInput } from "@/lib/validation/auth-schemas";
import { customerSignup } from "@/lib/api/customer-auth";
import { useCustomerAuthStore } from "@/store/customer-auth-store";
import { FormField } from "@/components/ui/form-field";

export default function CustomerSignupPage() {
  const router = useRouter();
  const setAuth = useCustomerAuthStore((s) => s.setAuth);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CustomerSignupInput>({
    resolver: zodResolver(customerSignupSchema),
  });

  const mutation = useMutation({
    mutationFn: (input: CustomerSignupInput) => {
      const { confirmPassword: _confirmPassword, ...payload } = input;
      return customerSignup(payload);
    },
    onSuccess: (data) => {
      setAuth(data);
      router.push("/");
    },
  });

  const onSubmit = (input: CustomerSignupInput) => mutation.mutate(input);

  const errorMessage = isAxiosError(mutation.error)
    ? mutation.error.response?.data?.message ?? "Sign up failed. Please try again."
    : mutation.isError
      ? "Sign up failed. Please try again."
      : null;

  return (
    <div className="max-w-sm mx-auto px-4 py-16">
      <h1 className="font-display text-2xl font-semibold text-[#17181C]">
        Create an account
      </h1>
      <p className="text-sm text-neutral-500 mt-1 mb-6">
        Order food from restaurants near you.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          label="Full name"
          autoComplete="name"
          placeholder="Sita Rai"
          error={errors.fullName?.message}
          {...register("fullName")}
        />
        <FormField
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register("email")}
        />
        <FormField
          label="Phone"
          type="tel"
          autoComplete="tel"
          placeholder="98XXXXXXXX"
          error={errors.phone?.message}
          {...register("phone")}
        />
        <FormField
          label="Password"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          error={errors.password?.message}
          {...register("password")}
        />
        <FormField
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />

        {errorMessage && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            {typeof errorMessage === "string" ? errorMessage : "Sign up failed. Please try again."}
          </p>
        )}

        <button
          type="submit"
          disabled={mutation.isPending}
          className="w-full bg-[#17181C] text-white text-sm font-medium py-2.5 rounded-xl disabled:opacity-60"
        >
          {mutation.isPending ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="text-sm text-neutral-500 mt-5 text-center">
        Already have an account?{" "}
        <Link href="/login" className="text-[#17181C] font-medium underline underline-offset-2">
          Log in
        </Link>
      </p>
    </div>
  );
}
