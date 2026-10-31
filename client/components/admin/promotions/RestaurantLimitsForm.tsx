import React, { useState } from "react";
import { updateRestaurantPromotionLimits, PromotionLimits } from "@/lib/api/platform-admin";

interface PromotionLimitsFormProps {
  restaurantId: string;
  initialLimits: PromotionLimits;
}

export default function RestaurantPromotionLimitsForm({ 
  restaurantId, 
  initialLimits 
}: PromotionLimitsFormProps) {
  const [limits, setLimits] = useState<PromotionLimits>(initialLimits);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;

    if (type === "checkbox") {
      const currentTypes = new Set(limits.allowedCouponTypes || []);
      if (checked) {
        currentTypes.add(value as "PERCENTAGE" | "FLAT");
      } else {
        currentTypes.delete(value as "PERCENTAGE" | "FLAT");
      }
      setLimits({ ...limits, allowedCouponTypes: Array.from(currentTypes) });
    } else {
      setLimits({ ...limits, [name]: Number(value) });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setStatusMsg(null);

    try {
      await updateRestaurantPromotionLimits(restaurantId, limits);
      setStatusMsg({ type: "success", text: "Limits successfully updated." });
    } catch (error) {
      console.error("Failed to update limits:", error);
      setStatusMsg({ type: "error", text: "Failed to update limits. Please try again." });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Promotion & Storefront Limits</h3>
      
      {statusMsg && (
        <div className={`p-3 mb-4 rounded text-sm font-medium ${statusMsg.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
          {statusMsg.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Max Active Coupons</label>
            <input 
              type="number" 
              name="maxActivePromotions" 
              min="0"
              value={limits.maxActivePromotions ?? 5} 
              onChange={handleInputChange} 
              className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Max Discount Cap (%)</label>
            <input 
              type="number" 
              name="maxDiscountCap" 
              min="0"
              max="100"
              value={limits.maxDiscountCap ?? 50} 
              onChange={handleInputChange} 
              className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Max Active Banners</label>
            <input 
              type="number" 
              name="maxActiveBanners" 
              min="0"
              value={limits.maxActiveBanners ?? 3} 
              onChange={handleInputChange} 
              className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Max Active Popups</label>
            <input 
              type="number" 
              name="maxActivePopups" 
              min="0"
              value={limits.maxActivePopups ?? 1} 
              onChange={handleInputChange} 
              className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500" 
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Allowed Coupon Types</label>
          <div className="flex items-center space-x-6">
            <label className="flex items-center space-x-2">
              <input 
                type="checkbox" 
                value="PERCENTAGE" 
                checked={limits.allowedCouponTypes?.includes("PERCENTAGE") || false} 
                onChange={handleInputChange}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Percentage</span>
            </label>
            <label className="flex items-center space-x-2">
              <input 
                type="checkbox" 
                value="FLAT" 
                checked={limits.allowedCouponTypes?.includes("FLAT") || false} 
                onChange={handleInputChange}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Flat Amount</span>
            </label>
          </div>
        </div>

        <div className="flex justify-end">
          <button 
            type="submit" 
            disabled={isSaving} 
            className="bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? "Saving..." : "Save Limits"}
          </button>
        </div>
      </form>
    </div>
  );
}