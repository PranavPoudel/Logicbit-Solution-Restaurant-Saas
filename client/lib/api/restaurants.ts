// lib/api/restaurants.ts — Module 6: Restaurant (owner-facing)
import { ownerApiClient } from "@/lib/api/owner-client";
import type { Restaurant } from "@/types/owner";

export async function listMyRestaurants(): Promise<Restaurant[]> {
  const { data } = await ownerApiClient.get<Restaurant[]>("/restaurants");
  return data;
}

export async function getMyRestaurant(id: string): Promise<Restaurant> {
  const { data } = await ownerApiClient.get<Restaurant>(`/restaurants/${id}`);
  return data;
}

export interface UpdateRestaurantInput {
  name?: string;
  address?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  primaryColor?: string;
  secondaryColor?: string;
  heroHeading?: string;
  heroSubheading?: string;
  isOpen?: boolean;
  supportsDelivery?: boolean;
  supportsPickup?: boolean;
  supportsDineIn?: boolean;
  selfDeliveryRadiusKm?: number;
  selfDeliveryFlatFee?: number;
  maxDeliveryRadiusKm?: number;
  paypayMerchantId?: string;
  paypayApiKey?: string;
  paypayApiSecret?: string;
}

export async function updateMyRestaurant(id: string, input: UpdateRestaurantInput) {
  const { data } = await ownerApiClient.patch(`/restaurants/${id}`, input);
  return data;
}