// src/modules/restaurant/facilities.ts
// The amenities an owner can tick. Keys are stored; the client translates them.
// Keep in sync with client/lib/facilities.ts.
export const FACILITY_KEYS = [
  'parking',
  'wifi',
  'air_conditioning',
  'outdoor_seating',
  'family_friendly',
  'wheelchair_accessible',
  'kids_menu',
  'smoking_area',
] as const;
