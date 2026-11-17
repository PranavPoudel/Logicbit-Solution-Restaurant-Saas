// lib/api/restaurants.ts — Module 6: Restaurant (owner-facing)
import { ownerApiClient } from "@/lib/api/owner-client";
import type { Restaurant } from "@/types/owner";
import type { DayHours } from "@/types/hours";

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
  openingHours?: DayHours[];
  timezone?: string;
  supportsDelivery?: boolean;
  supportsPickup?: boolean;
  supportsDineIn?: boolean;
  selfDeliveryRadiusKm?: number;
  selfDeliveryFlatFee?: number;
  maxDeliveryRadiusKm?: number;
  paypayMerchantId?: string;
  paypayApiKey?: string;
  paypayApiSecret?: string;

  // Enabled Payment Methods
  supportsCod?: boolean;
  supportsCreditCard?: boolean; 
  supportsEsewa?: boolean;
  supportsKhalti?: boolean;
  supportsIps?: boolean;
  supportsPhonePay?: boolean;
  supportsPaypay?: boolean;
}

export interface RestaurantUpdatePayload {
  name?: string;
  address?: string;
  phone?: string;
  refundPolicy?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  primaryColor?: string;
  secondaryColor?: string;
  heroHeading?: string;
  heroSubheading?: string;
  isOpen?: boolean;
  openingHours?: DayHours[];
  timezone?: string;
  supportsDelivery?: boolean;
  supportsPickup?: boolean;
  supportsDineIn?: boolean;
  selfDeliveryRadiusKm?: number;
  selfDeliveryFlatFee?: number;
  maxDeliveryRadiusKm?: number;
  supportsCod?: boolean;
  supportsCreditCard?: boolean;
  supportsEsewa?: boolean;
  supportsKhalti?: boolean;
  supportsIps?: boolean;
  supportsPhonePay?: boolean;
  supportsPaypay?: boolean;
  paypayMerchantId?: string;
  paypayApiKey?: string;
  paypayApiSecret?: string;
  stripeSecretKey?: string;
}


/** Deletes the saved Stripe key and switches card payments off. Refused while customers are still paying by card. */
export async function removeMyStripeKey(id: string) {
  const { data } = await ownerApiClient.delete(`/restaurants/${id}/stripe-key`);
  return data;
}

/** The restaurant's own Uber Direct account. The secrets are write-only: the server never sends them back. */
export interface UberDirectStatus {
  connected: boolean;
  clientId: string | null;
  customerId: string | null;
  webhookPath: string;
  webhookUrl: string | null;
}

export interface UberDirectInput {
  clientId: string;
  clientSecret: string;
  customerId: string;
  signingKey: string;
}

export async function getMyUberDirect(id: string) {
  const { data } = await ownerApiClient.get<UberDirectStatus>(`/restaurants/${id}/uber-direct`);
  return data;
}

/** The server checks the login with Uber before it saves anything. */
export async function saveMyUberDirect(id: string, input: UberDirectInput) {
  const { data } = await ownerApiClient.put<UberDirectStatus>(`/restaurants/${id}/uber-direct`, input);
  return data;
}

/** Refused while an Uber courier is still on a delivery. */
export async function removeMyUberDirect(id: string) {
  const { data } = await ownerApiClient.delete<UberDirectStatus>(`/restaurants/${id}/uber-direct`);
  return data;
}

export async function updateMyRestaurant(id: string, input: UpdateRestaurantInput) {
  const { data } = await ownerApiClient.patch(`/restaurants/${id}`, input);
  return data;
}