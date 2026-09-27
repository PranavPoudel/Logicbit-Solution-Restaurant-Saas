"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { deliveryLogin } from "@/lib/api/delivery-auth";
import { useDeliveryAuthStore } from "@/store/delivery-auth-store";

export default function DeliveryLoginPage() {
  const router = useRouter();

  const setAuth = useDeliveryAuthStore((state) => state.setAuth);

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await deliveryLogin({
        phone,
        password,
      });

      if (!response?.accessToken || !response?.deliveryPerson) {
        throw new Error("Invalid login response");
      }

      setAuth({
        accessToken: response.accessToken,
        deliveryPerson: response.deliveryPerson,
      });

      router.push("/delivery");
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Login failed. Please check your phone and password."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <div className="mb-8 text-center">
          <div className="text-4xl mb-3">🛵</div>

          <h1 className="text-2xl font-bold text-gray-900">
            Rider Login
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Login to manage your deliveries
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="phone"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Phone Number
            </label>

            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="Enter your phone number"
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Password
            </label>

            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-black px-4 py-3 font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          New rider?{" "}
          <a
            href="/delivery/register"
            className="font-medium text-black hover:underline"
          >
            Create an account
          </a>
        </p>
      </div>
    </main>
  );
}