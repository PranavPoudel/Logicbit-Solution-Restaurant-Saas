// app/(customer)/search/page.tsx
"use client";

import { useEffect, useState } from "react";
import { SearchBar } from "@/components/home/search-bar";
import { RestaurantCard } from "@/components/restaurant/restaurant-card";
import { getNearbyRestaurants } from "@/lib/api/discovery";
import type { DiscoveryRestaurant } from "@/types/restaurant";
import { theme } from "@/config/theme";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [allRestaurants, setAllRestaurants] = useState<DiscoveryRestaurant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Default to Kirtipur coordinates used elsewhere on the site;
    // swap for real geolocation later if available.
    getNearbyRestaurants({ lat: 27.6766, lng: 85.3253, radiusKm: 20, limit: 50 })
      .then((res) => setAllRestaurants(res.data))
      .finally(() => setLoading(false));
  }, []);

  const filtered = query.trim()
    ? allRestaurants.filter((r) =>
        r.name?.toLowerCase().includes(query.trim().toLowerCase())
      )
    : allRestaurants;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="font-serif font-semibold text-xl mb-4" style={{ color: theme.colors.dark }}>
        Search
      </h1>

      <div className="mb-6 max-w-lg">
        <SearchBar value={query} onChange={setQuery} autoFocus />
      </div>

      {loading ? (
        <p className="text-sm" style={{ color: `${theme.colors.dark}66` }}>
          Loading restaurants…
        </p>
      ) : filtered.length === 0 ? (
        <p className="text-sm" style={{ color: `${theme.colors.dark}66` }}>
          {query.trim()
            ? `No restaurants found for "${query}".`
            : "No restaurants available."}
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((restaurant) => (
            <RestaurantCard key={restaurant.id} restaurant={restaurant} />
          ))}
        </div>
      )}
    </div>
  );
}