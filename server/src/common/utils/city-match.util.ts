import { haversineDistanceKm } from './haversine.util';

export interface CityRef {
  name: string;
  nameJa?: string | null;
  latitude: number;
  longitude: number;
}

const NEAR_KM = 100; // shortcut: one fixed radius, make it a setting if cities ever sit further apart
const key = (s?: string | null) => (s ?? '').trim().toLowerCase();

export function findCityByName(cities: CityRef[], text?: string | null) {
  const wanted = key(text);
  return wanted ? cities.find((c) => key(c.name) === wanted || key(c.nameJa) === wanted) : undefined;
}

export function nearestCity(cities: CityRef[], lat?: number | null, lng?: number | null) {
  if (lat == null || lng == null) return undefined;
  const km = (c: CityRef) => haversineDistanceKm(lat, lng, c.latitude, c.longitude);
  const nearest = cities.reduce<CityRef | undefined>((best, c) => (!best || km(c) < km(best) ? c : best), undefined);
  return nearest && km(nearest) <= NEAR_KM ? nearest : undefined;
}
