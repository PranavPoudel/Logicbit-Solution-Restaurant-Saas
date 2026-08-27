// lib/api/advertisements.ts — Module 15: Advertisement
import { ownerApiClient } from "@/lib/api/owner-client";
import { platformApiClient } from "@/lib/api/platform-client";

export type AdPlacementType = "HOMEPAGE_BANNER" | "SEARCH_BOOST" | "POPUP";
export type AdStatus = "PENDING" | "ACTIVE" | "REJECTED";

// Field names confirmed against server CreateAdvertisementDto.
// "placementType" (not "placement") and "title" are both required.
export interface AdvertisementRequestInput {
  placementType: AdPlacementType;
  title: string;
  imageUrl?: string;
  linkUrl?: string;
  startDate: string;
  endDate: string;
}

export interface Advertisement extends AdvertisementRequestInput {
  id: string;
  restaurantId: string;
  status: AdStatus;
  amountPaid?: number | null;
  priority?: number;
  rejectionReason?: string | null;
  createdAt: string;
}

// Owner — request
export async function requestAdvertisement(
  restaurantId: string,
  input: AdvertisementRequestInput,
) {
  const { data } = await ownerApiClient.post(
    `/restaurants/${restaurantId}/advertisements`,
    input
  );
  return data;
}

export async function listRestaurantAdvertisements(
  restaurantId: string,
): Promise<Advertisement[]> {
  const { data } = await ownerApiClient.get(`/restaurants/${restaurantId}/advertisements`);
  return data;
}

// Platform — approve/reject
export async function listPendingAdvertisements(): Promise<Advertisement[]> {
  const { data } = await platformApiClient.get("/platform-admin/advertisements/pending");
  return data;
}

// Server's ApproveAdvertisementDto requires amountPaid — the old version of
// this function sent no body at all, which would fail validation.
export async function approveAdvertisement(
  id: string,
  input: { amountPaid: number; priority?: number },
) {
  const { data } = await platformApiClient.patch(
    `/platform-admin/advertisements/${id}/approve`,
    input
  );
  return data;
}

export async function rejectAdvertisement(id: string, reason?: string) {
  const { data } = await platformApiClient.patch(
    `/platform-admin/advertisements/${id}/reject`,
    { reason }
  );
  return data;
}
