// components/layout/owner-topbar.tsx
"use client";

import { useState } from "react";
import { Bell, ChevronDown, LogOut } from "lucide-react";
import { useOwnerAuthStore } from "@/store/owner-auth-store";

export function OwnerTopbar() {
  const { user, restaurants, activeRestaurantId, setActiveRestaurant, logout } =
    useOwnerAuthStore();
  const [restaurantMenuOpen, setRestaurantMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  const activeRestaurant =
    restaurants.find((r) => r.id === activeRestaurantId) ?? restaurants[0];

  return (
    <header className="h-16 shrink-0 border-b border-neutral-200 bg-white flex items-center justify-between px-6">
      {/* Restaurant switcher */}
      <div className="relative">
        <button
          onClick={() => setRestaurantMenuOpen((v) => !v)}
          className="flex items-center gap-2 text-sm font-medium text-neutral-800 hover:bg-neutral-100 px-3 py-1.5 rounded-md"
        >
          {activeRestaurant ? activeRestaurant.name : "Select restaurant"}
          <ChevronDown size={15} className="text-neutral-400" />
        </button>

        {restaurantMenuOpen && restaurants.length > 0 && (
          <div className="absolute left-0 mt-1 w-64 bg-white border border-neutral-200 rounded-lg shadow-lg py-1 z-20">
            {restaurants.map((r) => (
              <button
                key={r.id}
                onClick={() => {
                  setActiveRestaurant(r.id);
                  setRestaurantMenuOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-neutral-50 flex items-center justify-between ${
                  r.id === activeRestaurantId ? "text-[#1B2333] font-medium" : "text-neutral-600"
                }`}
              >
                {r.name}
                {r.id === activeRestaurantId && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E3A008]" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        <button
          aria-label="Notifications"
          className="relative p-2 rounded-md hover:bg-neutral-100 text-neutral-600"
        >
          <Bell size={19} />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#E3A008]" />
        </button>

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
                onClick={logout}
                className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <LogOut size={15} />
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
