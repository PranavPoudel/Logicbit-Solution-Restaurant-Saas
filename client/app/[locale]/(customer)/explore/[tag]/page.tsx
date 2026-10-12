"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getNearbyRestaurants } from "@/lib/api/discovery";
import { AppImage } from "@/components/ui/app-image";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1595917248955-a96ace4780b6?q=80&w=1169&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";

const TITLES: Record<string, string> = {
  trending: "Trending now",
  new: "New on LogicBit",
  popular: "Popular this week",
};

// Default location (Kathmandu)
const DEFAULT_LAT = 27.7172;
const DEFAULT_LNG = 85.324;

export default function ExploreTagPage() {
  const params = useParams();
  const tag = String(params?.tag ?? "trending");
  const title = TITLES[tag] ?? "Explore";

  const { data, isLoading, isError } = useQuery({
    queryKey: ["explore", tag],
    queryFn: () =>
      getNearbyRestaurants({
        lat: DEFAULT_LAT,
        lng: DEFAULT_LNG,
        radiusKm: 50,
        limit: 50,
      }),
  });

  const restaurants: any[] = [...(data?.data ?? [])].sort((a: any, b: any) => {
    if (tag === "new") {
      return (
        new Date(b.createdAt ?? 0).getTime() -
        new Date(a.createdAt ?? 0).getTime()
      );
    }
    return Number(b.rating ?? b.averageRating ?? 0) - Number(a.rating ?? a.averageRating ?? 0);
  });

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <Link href="/" className="text-sm text-[#17181C]/60 hover:underline">
        ← Back to home
      </Link>
      <h1 className="mt-3 mb-6 text-2xl font-semibold text-[#17181C]">{title}</h1>

      {isLoading && <p className="text-sm text-[#17181C]/60">Loading...</p>}
      {isError && (
        <p className="text-sm text-red-600">Could not load restaurants.</p>
      )}
      {!isLoading && !isError && restaurants.length === 0 && (
        <p className="text-sm text-[#17181C]/60">No restaurants found.</p>
      )}

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {restaurants.map((r) => (
          <Link
            key={r.id}
            href={`/restaurants/${r.slug ?? r.id}`}
            className="overflow-hidden rounded-2xl border border-[#E8E7E2] bg-white transition hover:border-[#E3A008] hover:shadow-md"
          >
            <div className="h-40 w-full bg-[#F4F3EE]">
              <AppImage
                src={r.coverImageUrl ?? r.coverImage ?? r.imageUrl ?? FALLBACK_IMAGE}
                alt={r.name}
                sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="p-4">
              <h2 className="font-medium text-[#17181C]">{r.name}</h2>
              <p className="mt-1 text-xs text-[#17181C]/60">
                ★ {Number(r.rating ?? r.averageRating ?? 0).toFixed(1)}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}