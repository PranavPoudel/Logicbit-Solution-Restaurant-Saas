
const NOMINATIM = "https://nominatim.openstreetmap.org";

export interface GeocodeResult {
  lat: number;
  lng: number;
  address: string;
}

export async function geocodeAddress(query: string): Promise<GeocodeResult | null> {
  const q = query.trim();
  if (!q) return null;
  const res = await fetch(
    `${NOMINATIM}/search?format=json&limit=1&q=${encodeURIComponent(q)}`
  );
  if (!res.ok) throw new Error(`Geocoding failed (${res.status})`);
  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0) return null;
  return {
    lat: parseFloat(data[0].lat),
    lng: parseFloat(data[0].lon),
    address: data[0].display_name,
  };
}

export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const res = await fetch(
      `${NOMINATIM}/reverse?format=json&lat=${lat}&lon=${lng}`
    );
    if (!res.ok) return null;
    const data = await res.json();
    return typeof data?.display_name === "string" ? data.display_name : null;
  } catch {
    return null;
  }
}
