import type { CuisineLike, DiscoveryRestaurant } from "@/types/restaurant";
import { theme } from "@/config/theme";
import { getFullImageUrl } from "@/lib/utils/image";

export function cuisineList(cuisines: CuisineLike[] | undefined): { key: string; name: string }[] {
  return (cuisines ?? [])
    .map((c) =>
      typeof c === "string"
        ? { key: c, name: c }
        : { key: c.id || c.slug || c.name || "", name: c.name || c.slug || "" }
    )
    .filter((c) => c.name);
}

const CUISINE_IMAGES: Record<string, string> = {
  nepali: "/images/cuisine-nepali.jpg.avif",
  newari: "/images/cuisine-newari.jpg.avif",
  "fast-food": "/images/cuisine-fastfood.jpg.avif",
  chinese: "/images/cuisine-chinese.jpg.avif",
  indian: "/images/cuisine-indian.jpg.avif",
  desserts: "/images/cuisine-desserts.jpg.avif",
};
const FALLBACK = theme.brand.fallbackImage;

export const cuisineSlug = (c?: CuisineLike) => {
  if (!c) return "";
  const raw = typeof c === "string" ? c : c.slug ?? c.name ?? "";
  return raw.toLowerCase().replace(/\s+/g, "-");
};

export const cuisineName = (c: CuisineLike) => (typeof c === "string" ? c : c.name ?? c.slug ?? "");

export const cuisineImage = (slug?: string) => CUISINE_IMAGES[slug ?? ""] ?? FALLBACK;

export function restaurantImage(r: { coverImageUrl?: string | null; cuisines?: CuisineLike[] }) {
  return (r.coverImageUrl && getFullImageUrl(r.coverImageUrl)) || cuisineImage(cuisineSlug(r.cuisines?.[0]));
}

export const matchesQuery = (r: DiscoveryRestaurant, needle: string) =>
  !needle || `${r.name ?? ""} ${(r.cuisines ?? []).map(cuisineName).join(" ")} ${r.city ?? ""}`.toLowerCase().includes(needle);

const CUISINE_ORDER = ["nepali", "newari", "fast-food", "chinese", "indian", "desserts"];
const cuisineRank = (c: CuisineLike) => {
  const i = CUISINE_ORDER.indexOf(cuisineSlug(c));
  return i === -1 ? CUISINE_ORDER.length : i;
};
export const byCuisineOrder = <T extends CuisineLike>(cuisines: T[]) => [...cuisines].sort((a, b) => cuisineRank(a) - cuisineRank(b));
