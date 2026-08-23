// types/restaurant.ts

/**
 * Shape returned by GET /discovery/restaurants/nearby.
 * NOTE: placeholder — confirm exact field names against Swagger before
 * wiring the real fetch.
 */
export interface DiscoveryRestaurant {
  id: string;
  slug?: string;
  name?: string;
  coverImageUrl?: string;
  avgRating?: number;
  cuisines?: string[];
  distanceKm?: number;
  isOpen?: boolean;
  isSponsored?: boolean;
  estimatedDeliveryMinutes?: number;
}
