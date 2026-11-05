//app/admin/restaurants/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getRestaurantFullDetail } from "@/lib/api/platform-admin";
import RestaurantPromotionLimitsForm from "@/components/admin/promotions/RestaurantLimitsForm";

export default function RestaurantDetailsPage() {
  const params = useParams();
  const id = params.id as string;
  
  const [restaurant, setRestaurant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDetails = async () => {
      try {
        setLoading(true);
        const data = await getRestaurantFullDetail(id);
        setRestaurant(data?.data || data);
      } catch (err: any) {
        console.error("Failed to load restaurant details:", err);
        setError(err?.response?.data?.message || "Failed to load restaurant details.");
      } finally {
        setLoading(false);
      }
    };
    
    if (id) loadDetails();
  }, [id]);

  if (loading) {
    return <div className="p-6 text-gray-500 animate-pulse">Loading restaurant details...</div>;
  }

  if (error || !restaurant) {
    return (
      <div className="p-6">
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-4">{error || "Restaurant not found"}</div>
        <Link href="/admin/restaurants" className="text-blue-600 hover:underline">
          &larr; Back to Restaurants
        </Link>
      </div>
    );
  }

  // 1. Extract the limits for the form
  const initialLimits = {
    maxActivePromotions: restaurant.maxActivePromotions,
    maxDiscountCap: restaurant.maxDiscountCap,
    allowedCouponTypes: restaurant.allowedCouponTypes,
    maxActiveBanners: restaurant.maxActiveBanners,
    maxActivePopups: restaurant.maxActivePopups,
  };

  return (
    <div className="p-6 max-w-5xl">
      <div className="mb-6">
        <Link href="/admin/restaurants" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
          &larr; Back to Restaurants
        </Link>
      </div>

      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            {restaurant.name}
            {restaurant.isSuspended ? (
              <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full bg-red-100 text-red-700">
                Suspended
              </span>
            ) : (
              <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full bg-green-100 text-green-700">
                Active
              </span>
            )}
          </h2>
          <p className="text-sm text-gray-500 mt-1 font-mono">ID: {restaurant.id}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Core Information */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">General Information</h3>
          <ul className="space-y-3 text-sm">
            <li className="flex justify-between">
              <span className="text-gray-500">Address:</span>
              <span className="font-medium text-gray-900 text-right">{restaurant.address || "N/A"}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-gray-500">City:</span>
              <span className="font-medium text-gray-900">{restaurant.city || "N/A"}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-gray-500">Coordinates:</span>
              <span className="font-medium text-gray-900 font-mono">
                {restaurant.latitude && restaurant.longitude 
                  ? `${restaurant.latitude}, ${restaurant.longitude}` 
                  : "Not set"}
              </span>
            </li>
            <li className="flex justify-between border-t pt-3 mt-2">
              <span className="text-gray-500">Platform Commission:</span>
              <span className="font-bold text-blue-600">{restaurant.commissionRate ?? 0}%</span>
            </li>
          </ul>
        </div>

        {/* Storefront & Branding */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Storefront & Branding</h3>
          <ul className="space-y-3 text-sm">
            <li className="flex justify-between">
              <span className="text-gray-500">Hero Heading:</span>
              <span className="font-medium text-gray-900">{restaurant.heroHeading || "N/A"}</span>
            </li>
            <li className="flex justify-between items-center">
              <span className="text-gray-500">Primary Color:</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs">{restaurant.primaryColor || "Default"}</span>
                {restaurant.primaryColor && (
                  <div className="w-4 h-4 rounded-full border border-gray-300" style={{ backgroundColor: restaurant.primaryColor }} />
                )}
              </div>
            </li>
            <li className="flex justify-between items-center">
              <span className="text-gray-500">Secondary Color:</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs">{restaurant.secondaryColor || "Default"}</span>
                {restaurant.secondaryColor && (
                  <div className="w-4 h-4 rounded-full border border-gray-300" style={{ backgroundColor: restaurant.secondaryColor }} />
                )}
              </div>
            </li>
          </ul>
        </div>

        {/* Operational Settings */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Operational Settings</h3>
          <ul className="space-y-3 text-sm">
            <li className="flex justify-between items-center">
              <span className="text-gray-500">Currently Open:</span>
              <span className={restaurant.isOpen ? "text-green-600 font-bold" : "text-gray-500 font-bold"}>
                {restaurant.isOpen ? "YES" : "NO"}
              </span>
            </li>
            <li className="flex justify-between items-center">
              <span className="text-gray-500">Supports Delivery:</span>
              <span className={restaurant.supportsDelivery ? "text-green-600 font-medium" : "text-gray-400"}>
                {restaurant.supportsDelivery ? "Yes" : "No"}
              </span>
            </li>
            <li className="flex justify-between items-center">
              <span className="text-gray-500">Supports Pickup:</span>
              <span className={restaurant.supportsPickup ? "text-green-600 font-medium" : "text-gray-400"}>
                {restaurant.supportsPickup ? "Yes" : "No"}
              </span>
            </li>
            <li className="flex justify-between items-center">
              <span className="text-gray-500">Supports Dine-In:</span>
              <span className={restaurant.supportsDineIn ? "text-green-600 font-medium" : "text-gray-400"}>
                {restaurant.supportsDineIn ? "Yes" : "No"}
              </span>
            </li>
          </ul>
        </div>

        {/* Delivery Configuration */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Delivery Configuration</h3>
          <ul className="space-y-3 text-sm">
            <li className="flex justify-between">
              <span className="text-gray-500">Self Delivery Radius:</span>
              <span className="font-medium text-gray-900">{restaurant.selfDeliveryRadiusKm ? `${restaurant.selfDeliveryRadiusKm} km` : "N/A"}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-gray-500">Max Delivery Radius:</span>
              <span className="font-medium text-gray-900">{restaurant.maxDeliveryRadiusKm ? `${restaurant.maxDeliveryRadiusKm} km` : "N/A"}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-gray-500">Self Delivery Flat Fee:</span>
              <span className="font-medium text-gray-900">
                {restaurant.selfDeliveryFlatFee !== undefined && restaurant.selfDeliveryFlatFee !== null 
                  ? `$${Number(restaurant.selfDeliveryFlatFee).toFixed(2)}` 
                  : "N/A"}
              </span>
            </li>
          </ul>
        </div>
      </div>

      {/* 2. New Promotion & Storefront Limits Section */}
      <div className="mb-8">
        <RestaurantPromotionLimitsForm 
          restaurantId={id} 
          initialLimits={initialLimits} 
        />
      </div>
    </div>
  );
}