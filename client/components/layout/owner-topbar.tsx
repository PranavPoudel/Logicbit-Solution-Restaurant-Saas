"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, LogOut, Plus } from "lucide-react";
import { useOwnerAuthStore } from "@/store/owner-auth-store";
import { AddRestaurantModal } from "./add-restaurant-modal";
import { OwnerNotifications } from "./owner-notifications";

export function OwnerTopbar() {
  const router = useRouter();
  const { user, restaurants, activeRestaurantId, setActiveRestaurant, logout } =
    useOwnerAuthStore();
  const [restaurantMenuOpen, setRestaurantMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const activeRestaurant =
    restaurants.find((r) => r.id === activeRestaurantId) ?? restaurants[0];

  return (
    <>
      <header className="h-16 shrink-0 border-b border-neutral-200 bg-white flex items-center justify-between px-6">
        {/* Restaurant switcher */}
        <div className="relative">
          <button
            onClick={() => setRestaurantMenuOpen((v) => !v)}
            className="flex items-center gap-2 text-sm font-medium text-neutral-800 hover:bg-neutral-100 px-3 py-1.5 rounded-md transition-colors"
          >
            {activeRestaurant ? activeRestaurant.name : "Select restaurant"}
            <ChevronDown size={15} className="text-neutral-400" />
          </button>

          {restaurantMenuOpen && (
            <div className="absolute left-0 mt-1 w-64 bg-white border border-neutral-200 rounded-lg shadow-lg py-1 z-20">
              {restaurants.length > 0 ? (
                restaurants.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => {
                      setActiveRestaurant(r.id);
                      setRestaurantMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-neutral-50 flex items-center justify-between transition-colors ${
                      r.id === activeRestaurantId
                        ? "text-[#1B2333] font-medium"
                        : "text-neutral-600"
                    }`}
                  >
                    {r.name}
                    {r.id === activeRestaurantId && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#E3A008]" />
                    )}
                  </button>
                ))
              ) : (
                <div className="px-3 py-2 text-sm text-neutral-500">
                  No restaurants found
                </div>
              )}
              
              <div className="border-t border-neutral-100 my-1" />
              <button
                onClick={() => {
                  setIsAddModalOpen(true);
                  setRestaurantMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-sm text-[#0F6B5C] hover:bg-[#0F6B5C]/5 flex items-center gap-2 transition-colors"
              >
                <Plus size={15} />
                Add new restaurant
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          <OwnerNotifications key={activeRestaurantId} />

          <div className="relative">
            <button
              onClick={() => setAccountMenuOpen((v) => !v)}
              className="flex items-center gap-2"
            >
              <div className="w-8 h-8 rounded-full bg-[#1B2333] text-white flex items-center justify-center text-xs font-semibold">
                {user?.fullName?.charAt(0)?.toUpperCase() ?? "?"}
              </div>
            </button>

            {accountMenuOpen && (
              <div className="absolute right-0 mt-1 w-48 bg-white border border-neutral-200 rounded-lg shadow-lg py-1 z-20">
                <div className="px-3 py-2 text-sm text-neutral-800 border-b border-neutral-100">
                  <p className="font-medium truncate">{user?.fullName ?? "—"}</p>
                  <p className="text-neutral-400 text-xs truncate">
                    {user?.email ?? ""}
                  </p>
                </div>
                <button
                  onClick={() => {
                    logout();
                    router.push("/owner/login"); // ✅ Redirect to namespaced login
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                >
                  <LogOut size={15} />
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <AddRestaurantModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </>
  );
}

export default OwnerTopbar;