"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { registerOwner, type OwnerRegisterInput } from "@/lib/api/auth";
import { useOwnerAuthStore } from "@/store/owner-auth-store"; 
import { DynamicMapPicker } from "@/components/map/dynamic-map-picker";

export default function OwnerRegisterPage() {
  const router = useRouter();
  const setAuth = useOwnerAuthStore((state) => state.setAuth); 
  
  const [isLoading, setIsLoading] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<OwnerRegisterInput>({
    name: "",
    email: "",
    phone: "",
    password: "",
    restaurantName: "",
    restaurantAddress: "",
    latitude: 27.7172, 
    longitude: 85.3240,
    acceptTerms: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // 1. Forward Geocoding: Address -> Map
  const handleGeocodeAddress = async () => {
    if (!formData.restaurantAddress.trim()) return;
    
    setIsGeocoding(true);
    setError(null);
    
    try {
      // Using OpenStreetMap Nominatim (Free, no API key needed for low volume)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(formData.restaurantAddress)}&limit=1`,
        {
          headers: {
            'User-Agent': 'LogicBitAI/1.0 (owner@logicbit.ai)' // Required by Nominatim
          }
        }
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        const { lat, lon, display_name } = data[0];
        setFormData((prev) => ({
          ...prev,
          latitude: parseFloat(lat),
          longitude: parseFloat(lon),
          // Optional: Standardize the address to the official OSM format for accuracy
          restaurantAddress: display_name, 
        }));
      } else {
        setError("Could not find this address. Please try a more specific location or adjust the pin manually.");
      }
    } catch (err) {
      console.error("Geocoding error:", err);
      setError("Failed to search address. Please check your connection or adjust the pin manually.");
    } finally {
      setIsGeocoding(false);
    }
  };

  // 2. Reverse Geocoding: Map -> Address (Triggered on dragend)
  const handleMapChange = async (lat: number, lng: number) => {
    // Update coordinates immediately for responsive UI
    setFormData((prev) => ({ ...prev, latitude: lat, longitude: lng }));
    
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
        {
          headers: {
            'User-Agent': 'LogicBitAI/1.0 (owner@logicbit.ai)'
          }
        }
      );
      const data = await response.json();
      if (data && data.display_name) {
        setFormData((prev) => ({ ...prev, restaurantAddress: data.display_name }));
      }
    } catch (err) {
      console.error("Reverse geocoding error:", err);
      // Silent fail for reverse geocoding so we don't annoy the user while dragging
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await registerOwner(formData);
      
      // ✅ FIX: The interceptor unwraps { success, data, message } -> data.
      // So `response` is the inner payload. We check for tokens directly on it.
      const tokens = response.tokens || response.data?.tokens;
      const user = response.user || response.data?.user;
      const restaurants = response.restaurants || response.data?.restaurants || [];

      if (tokens && user) {
        setAuth({
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          user: user,
          restaurants: restaurants, 
        });
        
        // Redirect to dashboard
        router.push("/owner/dashboard"); 
      } else {
        setError(response.message || "Registration failed. Please try again.");
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message 
        ? (Array.isArray(err.response.data.message) ? err.response.data.message.join(", ") : err.response.data.message)
        : err.message || "An unexpected error occurred. Please check your connection.";
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA] px-4 py-8">
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
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="restaurantAddress"
                    required
                    value={formData.restaurantAddress}
                    onChange={handleChange}
                    className="flex-1 px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-[#1B2333] focus:border-transparent outline-none transition"
                    placeholder="e.g. Street, area, city"
                  />
                  <button
                    type="button"
                    onClick={handleGeocodeAddress}
                    disabled={isGeocoding || !formData.restaurantAddress.trim()}
                    className="px-4 py-2 bg-[#1B2333] text-white text-sm font-medium rounded-lg hover:bg-[#2B2D33] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 whitespace-nowrap"
                  >
                    {isGeocoding ? (
                      <>
                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Searching...
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        Find
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Map Picker UI */}
              <div>
                <label className="block text-sm font-medium text-[#1B2333] mb-1">
                  Pinpoint Location on Map
                </label>
                <p className="text-xs text-neutral-500 mb-2">
                  Drag the marker or click on the map to set your exact delivery coordinates.
                </p>
                <DynamicMapPicker
                  lat={formData.latitude || 27.7172}
                  lng={formData.longitude || 85.3240}
                  onChange={handleMapChange}
                />
                <div className="flex gap-4 mt-2 text-xs font-mono text-neutral-500">
                  <span>Lat: {formData.latitude?.toFixed(5)}</span>
                  <span>Lng: {formData.longitude?.toFixed(5)}</span>
                </div>
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