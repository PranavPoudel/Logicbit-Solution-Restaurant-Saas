"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { registerOwner, type OwnerRegisterInput } from "@/lib/api/auth";
import { useOwnerAuthStore } from "@/store/owner-auth-store"; // Adjust path to your Zustand store

export default function OwnerRegisterPage() {
  const router = useRouter();
  const setAuth = useOwnerAuthStore((state) => state.setAuth); // Adjust based on your store's actual method name
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<OwnerRegisterInput>({
    name: "",
    email: "",
    phone: "",
    password: "",
    restaurantName: "",
    restaurantAddress: "",
    acceptTerms: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await registerOwner(formData);
        
      if (response.success && response.data?.tokens) {
        // Save to Zustand store
        setAuth(response.data.tokens.accessToken, response.data.user);
        
        // Redirect to owner dashboard or restaurant setup
        router.push("/owner/dashboard"); // Adjust route to your actual dashboard path
      } else {
        setError(response.message || "Registration failed. Please try again.");
      }
    } catch (err: any) {
      // Extract error message from backend's { success, message, error } envelope
      const errorMsg = err.response?.data?.message 
        ? (Array.isArray(err.response.data.message) ? err.response.data.message.join(", ") : err.response.data.message)
        : "An unexpected error occurred. Please check your connection.";
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA] px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-[#E8E7E2] p-8">
        <div className="text-center mb-8">
          <h1 className="font-display text-2xl font-semibold text-[#1B2333]">
            Create your Restaurant Account
          </h1>
          <p className="text-sm text-neutral-500 mt-2">
            Join LogicBit and start managing your orders today.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Owner Details */}
          <div>
            <label className="block text-sm font-medium text-[#1B2333] mb-1">Full Name</label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-[#1B2333] focus:border-transparent outline-none transition"
              placeholder="e.g. Ram Shrestha"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1B2333] mb-1">Email Address</label>
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-[#1B2333] focus:border-transparent outline-none transition"
              placeholder="owner@restaurant.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1B2333] mb-1">Phone Number</label>
            <input
              type="tel"
              name="phone"
              required
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-[#1B2333] focus:border-transparent outline-none transition"
              placeholder="9841000000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1B2333] mb-1">Password</label>
            <input
              type="password"
              name="password"
              required
              minLength={8}
              value={formData.password}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-[#1B2333] focus:border-transparent outline-none transition"
              placeholder="Min. 8 characters"
            />
          </div>

          <div className="border-t border-neutral-200 my-4 pt-4">
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3">Restaurant Details</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1B2333] mb-1">Restaurant Name</label>
                <input
                  type="text"
                  name="restaurantName"
                  required
                  value={formData.restaurantName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-[#1B2333] focus:border-transparent outline-none transition"
                  placeholder="e.g. Himalayan Kitchen"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1B2333] mb-1">Restaurant Address</label>
                <input
                  type="text"
                  name="restaurantAddress"
                  required
                  value={formData.restaurantAddress}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-[#1B2333] focus:border-transparent outline-none transition"
                  placeholder="e.g. Thamel, Kathmandu"
                />
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2 pt-2">
            <input
              type="checkbox"
              name="acceptTerms"
              required
              checked={formData.acceptTerms}
              onChange={handleChange}
              className="mt-1 w-4 h-4 text-[#1B2333] border-neutral-300 rounded focus:ring-[#1B2333]"
            />
            <label className="text-sm text-neutral-600">
              I agree to the <Link href="/terms" className="text-[#1B2333] underline hover:text-[#0F6B5C]">Terms of Service</Link> and <Link href="/privacy" className="text-[#1B2333] underline hover:text-[#0F6B5C]">Privacy Policy</Link>.
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#1B2333] hover:bg-[#2B2D33] text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-4"
          >
            {isLoading ? "Creating Account..." : "Create Restaurant Account"}
          </button>
        </form>

        <p className="text-center text-sm text-neutral-500 mt-6">
          Already have an account?{" "}
          <Link href="/owner/login" className="text-[#1B2333] font-medium hover:underline">
            Log in here
          </Link>
        </p>
      </div>
    </div>
  );
}
