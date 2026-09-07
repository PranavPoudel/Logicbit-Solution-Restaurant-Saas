// app/platform-admin/login/page.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { platformLogin } from "@/lib/api/platform-auth";
import { usePlatformAuthStore } from "@/store/platform-auth-store";

export default function PlatformAdminLoginPage() {
  const router = useRouter();

  const setAuth = usePlatformAuthStore((state) => state.setAuth);

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSubmitting(true);

    try {
      const response = await platformLogin(form);

      // Check that the backend returned the expected data
      if (!response?.success) {
        throw new Error(
          response?.message || "Login failed."
        );
      }

      const { staff, permissions, accessToken } = response.data;

      if (!accessToken || !staff) {
        throw new Error("Login response is missing staff or access token.");
      }

      // Save login information
      setAuth({
        accessToken,
        staff: {
          id: staff.id,
          name: staff.name,
          email: staff.email,
          role: staff.role,
          permissions: permissions || [],
        },
      });

      // Go to platform admin dashboard
      router.push("/platform-admin/advertisements");
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Login failed.";

      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 px-4">
      <div className="w-full max-w-sm bg-white rounded-xl p-8 shadow-lg">

        <h1 className="text-xl font-semibold text-neutral-900 mb-1">
          Platform Admin
        </h1>

        <p className="text-sm text-neutral-500 mb-6">
          Sign in with your staff account.
        </p>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2 mb-4">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4"
        >

          {/* Email */}
          <label className="text-sm font-medium text-neutral-700 flex flex-col gap-1">
            Email

            <input
              type="email"
              placeholder="admin@logicbit.local"
              className="border border-neutral-300 rounded-md px-3 py-2 text-sm text-neutral-900 outline-none focus:ring-2 focus:ring-neutral-900"
              value={form.email}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  email: event.target.value,
                }))
              }
              required
            />
          </label>

          {/* Password */}
          <label className="text-sm font-medium text-neutral-700 flex flex-col gap-1">
            Password

            <input
              type="password"
              placeholder="Enter password"
              className="border border-neutral-300 rounded-md px-3 py-2 text-sm text-neutral-900 outline-none focus:ring-2 focus:ring-neutral-900"
              value={form.password}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  password: event.target.value,
                }))
              }
              required
            />
          </label>

          {/* Login button */}
          <button
            type="submit"
            disabled={submitting}
            className="mt-2 bg-neutral-900 text-white text-sm font-medium rounded-md px-4 py-2 hover:bg-neutral-800 disabled:opacity-50"
          >
            {submitting ? "Logging in..." : "Log in"}
          </button>

        </form>
      </div>
    </div>
  );
}
```
