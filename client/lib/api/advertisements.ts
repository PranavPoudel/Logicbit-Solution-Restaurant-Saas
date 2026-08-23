// lib/api/advertisements.ts — Module 15: Advertisement
import { ownerApiClient } from "@/lib/api/owner-client";
import { platformApiClient } from "@/lib/api/platform-client";

// TODO: confirm exact DTO via Swagger.
export interface AdvertisementRequestInput {
  placement: string;
  startDate: string;
  endDate: string;
  [key: string]: unknown;
}

// Owner — request
export async function requestAdvertisement(restaurantId: string, input: AdvertisementRequestInput) {
  const { data } = await ownerApiClient.post(
    `/restaurants/${restaurantId}/advertisements`,
    input
  );
  return data;
}

export async function listRestaurantAdvertisements(restaurantId: string) {
  const { data } = await ownerApiClient.get(`/restaurants/${restaurantId}/advertisements`);
  return data;
}

// Platform — approve/reject
export async function listPendingAdvertisements() {
  const { data } = await platformApiClient.get("/platform-admin/advertisements/pending");
  return data;
}

export async function approveAdvertisement(id: string) {
  const { data } = await platformApiClient.patch(`/platform-admin/advertisements/${id}/approve`);
  return data;
}

export async function rejectAdvertisement(id: string) {
  const { data } = await platformApiClient.patch(`/platform-admin/advertisements/${id}/reject`);
  return data;
}
