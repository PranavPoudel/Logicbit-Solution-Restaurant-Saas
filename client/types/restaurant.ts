// types/restaurant.ts

export interface CuisineRef {
  id?: string;
  slug?: string;
  name?: string;
}
export type CuisineLike = string | CuisineRef;

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
  cuisines?: CuisineLike[];
  address?: string;
  phone?: string;
  distanceKm?: number;
  isOpen?: boolean;
  isSponsored?: boolean;
  estimatedDeliveryMinutes?: number;
  createdAt?: string;
  totalOrders?: number;
}
