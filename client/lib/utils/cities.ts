import type { City } from "@/lib/api/cities";
import { distanceKm } from "@/lib/utils/geo";

export type CityCounts = Record<string, number>;
type CityName = Pick<City, "name" | "nameJa">;
export type LiveCity = CityName & { id: string; count: number; latitude?: number; longitude?: number };

const NEAR_KM = 100;
const key = (s?: string | null) => (s ?? "").trim().toLowerCase();

export const countCities = (restaurants: { city?: string | null }[]): CityCounts =>
  restaurants.reduce<CityCounts>((counts, r) => {
    if (r.city) counts[r.city] = (counts[r.city] ?? 0) + 1;
    return counts;
  }, {});

export const cityLabel = (c: CityName, locale: string) => (locale === "ja" && c.nameJa) || c.name;

export const sameCity = (c: CityName, name?: string | null) => [c.name, c.nameJa].some((n) => n && key(n) === key(name));

const cityCount = (counts: CityCounts, c: CityName) =>
  Object.entries(counts).reduce((n, [name, count]) => (sameCity(c, name) ? n + count : n), 0);

export function liveCities(cities: City[], counts: CityCounts): LiveCity[] {
  const listed = cities.map((c) => ({ ...c, count: cityCount(counts, c) })).filter((c) => c.count > 0);
  const unlisted = Object.entries(counts)
    .filter(([name]) => !cities.some((c) => sameCity(c, name)))
    .map(([name, count]) => ({ id: name, name, nameJa: null, count }));
  return [...listed, ...unlisted];
}

export function pickHomeCity(cities: City[], counts: CityCounts, position?: { lat: number; lng: number } | null) {
  if (position) {
    const nearest = cities
      .map((c) => ({ c, d: distanceKm(position.lat, position.lng, c.latitude, c.longitude) }))
      .filter(({ d }) => d <= NEAR_KM)
      .sort((a, b) => a.d - b.d)[0];
    if (nearest) return nearest.c;
  }
  return cities.reduce<City | undefined>((best, c) => (!best || cityCount(counts, c) > cityCount(counts, best) ? c : best), undefined);
}
