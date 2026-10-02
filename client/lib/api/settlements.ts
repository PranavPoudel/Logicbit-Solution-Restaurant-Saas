// lib/api/settlements.ts — Module 16: Settlement
import { ownerApiClient } from "@/lib/api/owner-client";
import { platformApiClient } from "@/lib/api/platform-client";

// Owner — view
export async function listRestaurantSettlements(restaurantId: string) {
  const { data } = await ownerApiClient.get(`/restaurants/${restaurantId}/settlements`);
  return data;
}

export async function getOutstandingSettlement(restaurantId: string) {
  const { data } = await ownerApiClient.get(
    `/restaurants/${restaurantId}/settlements/outstanding`
  );
  return data;
}

// Platform — manage
export async function generateSettlement(
  restaurantId: string, 
  payload: { periodStart: string; periodEnd: string }
) {
  const { data } = await platformApiClient.post(
    `/platform-admin/settlements/restaurants/${restaurantId}/generate`,
    payload
  );
  return data;
}

export async function listPendingSettlements() {
  const { data } = await platformApiClient.get("/platform-admin/settlements/pending");
  return data;  
}

export async function markSettlementPaid(id: string) {
  const { data } = await platformApiClient.patch(`/platform-admin/settlements/${id}/mark-paid`);
  return data;
}
