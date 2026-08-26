"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Save, Loader2, Info } from "lucide-react";
import { useOwnerAuthStore } from "@/store/owner-auth-store";
import { 
  storefrontConfigApi, 
  type StorefrontConfigInput 
} from "@/lib/api/storefront";

export default function StorefrontConfigPage() {
  const queryClient = useQueryClient();
  const restaurantId = useOwnerAuthStore((s) => s.activeRestaurantId);

  // Fetch existing config
  const { data: config, isLoading } = useQuery({
    queryKey: ["storefront-config", restaurantId],
    queryFn: () => storefrontConfigApi.get(restaurantId as string),
    enabled: !!restaurantId,
  });

  // Form state
  const [formData, setFormData] = useState<StorefrontConfigInput>({
    aboutText: "",
    contactPhone: "",
    contactEmail: "",
    contactAddress: "",
    socialLinks: {},
    sectionOrder: ["banner", "offers", "menu", "about", "contact"], // Default from your schema
  });

  // Sync fetched data to form state
  useEffect(() => {
    if (config) {
      setFormData({
        aboutText: config.aboutText || "",
        contactPhone: config.contactPhone || "",
        contactEmail: config.contactEmail || "",
        contactAddress: config.contactAddress || "",
        socialLinks: config.socialLinks || {},
        sectionOrder: config.sectionOrder || ["banner", "offers", "menu", "about", "contact"],
      });
    }
  }, [config]);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: StorefrontConfigInput) => 
      storefrontConfigApi.update(restaurantId as string, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["storefront-config", restaurantId] });
      // Optional: show a toast notification here
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const handleSocialLinkChange = (platform: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      socialLinks: {
        ...(prev.socialLinks || {}),
        [platform]: value,
      },
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
        <span className="ml-2 text-sm text-neutral-500">Loading configuration...</span>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">Storefront Configuration</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Update the public-facing information displayed on your restaurant&apos;s website.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-neutral-200 p-6 space-y-6">
        
        {/* About Section */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-neutral-900 uppercase tracking-wide border-b border-neutral-200 pb-2">
            About & Contact
          </h2>
          
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">About Us</label>
            <textarea
              rows={4}
              value={formData.aboutText}
              onChange={(e) => setFormData(prev => ({ ...prev, aboutText: e.target.value }))}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-[#1B2333] focus:border-transparent outline-none resize-none"
              placeholder="Tell your customers about your restaurant's story, specialties, and vibe..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Contact Phone</label>
              <input
                type="tel"
                value={formData.contactPhone}
                onChange={(e) => setFormData(prev => ({ ...prev, contactPhone: e.target.value }))}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-[#1B2333] focus:border-transparent outline-none"
                placeholder="e.g. +977 9841000000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Contact Email</label>
              <input
                type="email"
                value={formData.contactEmail}
                onChange={(e) => setFormData(prev => ({ ...prev, contactEmail: e.target.value }))}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-[#1B2333] focus:border-transparent outline-none"
                placeholder="e.g. info@restaurant.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Physical Address</label>
            <input
              type="text"
              value={formData.contactAddress}
              onChange={(e) => setFormData(prev => ({ ...prev, contactAddress: e.target.value }))}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-[#1B2333] focus:border-transparent outline-none"
              placeholder="e.g. Thamel, Kathmandu, Nepal"
            />
          </div>
        </div>

        {/* Social Links Section */}
        <div className="space-y-4 pt-4 border-t border-neutral-200">
          <h2 className="text-sm font-semibold text-neutral-900 uppercase tracking-wide border-b border-neutral-200 pb-2">
            Social Media Links
          </h2>
          <p className="text-xs text-neutral-500 flex items-start gap-2">
            <Info size={14} className="mt-0.5 shrink-0" />
            Leave blank if you don&apos;t want to display a specific social media link on your storefront.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Facebook URL</label>
              <input
                type="url"
                value={formData.socialLinks?.facebook || ""}
                onChange={(e) => handleSocialLinkChange("facebook", e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-[#1B2333] focus:border-transparent outline-none"
                placeholder="https://facebook.com/..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Instagram URL</label>
              <input
                type="url"
                value={formData.socialLinks?.instagram || ""}
                onChange={(e) => handleSocialLinkChange("instagram", e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-[#1B2333] focus:border-transparent outline-none"
                placeholder="https://instagram.com/..."
              />
            </div>
          </div>
        </div>

        {/* Section Order (Advanced) */}
        <div className="space-y-4 pt-4 border-t border-neutral-200">
          <h2 className="text-sm font-semibold text-neutral-900 uppercase tracking-wide border-b border-neutral-200 pb-2">
            Page Layout (Advanced)
          </h2>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Section Display Order</label>
            <input
              type="text"
              value={formData.sectionOrder?.join(", ") || ""}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                sectionOrder: e.target.value.split(",").map(s => s.trim()).filter(Boolean)
              }))}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-[#1B2333] focus:border-transparent outline-none font-mono text-sm"
              placeholder="banner, offers, menu, about, contact"
            />
            <p className="text-xs text-neutral-500 mt-1">
              Comma-separated list of sections to display on the customer storefront.
            </p>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4 border-t border-neutral-200 flex justify-end">
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#1B2333] text-white rounded-lg hover:bg-[#2B2D33] transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Configuration
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
}