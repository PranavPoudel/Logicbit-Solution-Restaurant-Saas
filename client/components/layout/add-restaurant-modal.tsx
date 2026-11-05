"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Loader2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useOwnerAuthStore } from "@/store/owner-auth-store";
import { ownerApiClient } from "@/lib/api/owner-client";
import { listMyRestaurants } from "@/lib/api/restaurants";

interface AddRestaurantModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddRestaurantModal({ isOpen, onClose }: AddRestaurantModalProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const setRestaurants = useOwnerAuthStore((s) => s.setRestaurants);
  const setActiveRestaurant = useOwnerAuthStore((s) => s.setActiveRestaurant);

  const [name, setName] = useState("");
  const [city, setCity] = useState("");

  const createMutation = useMutation({
    mutationFn: async () => {
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      const { data } = await ownerApiClient.post("/restaurants", {
        name,
        slug,
        city,
        isOpen: true,
        supportsDelivery: true,
        supportsPickup: true,
        supportsDineIn: false,
      });
      return data;
    },
    onSuccess: async (newRestaurant) => {
      try {
        const freshRestaurants = await listMyRestaurants();
        setRestaurants(freshRestaurants);
        
        if (newRestaurant?.id) {
          setActiveRestaurant(newRestaurant.id);
        }
        
        onClose();
        setName("");
        setCity("");
        
        // ✅ Smooth client-side transition to the new namespace
        router.push("/owner/settings");
      } catch (error) {
        console.error("Error updating store:", error);
        alert("Restaurant created, but there was an issue switching to it. Please refresh.");
      }
    },
    onError: (error: any) => {
      console.error("Failed to create restaurant:", error);
      const message = error?.response?.data?.message || "Failed to create restaurant. Please try again.";
      alert(message);
    },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-900">Add New Restaurant</h2>
          <button onClick={onClose} className="p-1 hover:bg-neutral-100 rounded-full">
            <X size={20} className="text-neutral-500" />
          </button>
        </div>

        <p className="text-sm text-neutral-500">
          Create a new restaurant location. You can configure the menu, delivery, and branding in Settings afterward.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Restaurant Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Momo's & More - Branch 2"
              className="w-full px-3.5 py-2.5 text-sm border border-neutral-200 rounded-lg focus:ring-2 focus:ring-[#E3A008]/40 focus:border-[#E3A008] outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">City</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="City"
              className="w-full px-3.5 py-2.5 text-sm border border-neutral-200 rounded-lg focus:ring-2 focus:ring-[#E3A008]/40 focus:border-[#E3A008] outline-none"
              required
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-neutral-700 bg-neutral-100 rounded-lg hover:bg-neutral-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => createMutation.mutate()}
            disabled={!name.trim() || !city.trim() || createMutation.isPending}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-[#1B2333] rounded-lg hover:bg-[#2B2D33] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {createMutation.isPending ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Creating...
              </>
            ) : (
              "Create Restaurant"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}