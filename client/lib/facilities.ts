// lib/facilities.ts
// The amenities an owner can tick. Keep in sync with server/src/modules/restaurant/facilities.ts.
export const FACILITY_KEYS = [
  "parking",
  "wifi",
  "air_conditioning",
  "outdoor_seating",
  "family_friendly",
  "wheelchair_accessible",
  "kids_menu",
  "smoking_area",
] as const;

export type FacilityKey = (typeof FACILITY_KEYS)[number];

export const isFacilityKey = (value: string): value is FacilityKey => (FACILITY_KEYS as readonly string[]).includes(value);

// The owner dashboard is English only; customers see these translated (restaurant.facility.* in messages).
export const FACILITY_LABELS: Record<FacilityKey, string> = {
  parking: "Parking",
  wifi: "Wi-Fi",
  air_conditioning: "Air conditioning",
  outdoor_seating: "Outdoor seating",
  family_friendly: "Family friendly",
  wheelchair_accessible: "Wheelchair accessible",
  kids_menu: "Kids menu",
  smoking_area: "Smoking area",
};
