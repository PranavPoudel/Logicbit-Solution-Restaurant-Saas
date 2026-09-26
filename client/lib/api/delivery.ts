// lib/api/delivery.ts — Rider delivery operations
import { deliveryApiClient } from "@/lib/api/delivery-client";

export interface UpdateLocationInput {
  latitude: number;
  longitude: number;
}

export async function updateDeliveryLocation(input: UpdateLocationInput) {
  const { data } = await deliveryApiClient.patch("/delivery/location", input);
  return data;
}

export async function updateMyLocation(
  latitude: number,
  longitude: number
) {
  const { data } = await deliveryApiClient.patch("/delivery/location", {
    latitude,
    longitude,
  });

  return data;
}

export async function updateAvailability(isAvailable: boolean) {
  const { data } = await deliveryApiClient.patch("/delivery/availability", {
    isAvailable,
  });
  return data;
}

export async function toggleAvailability(isAvailable: boolean) {
  const { data } = await deliveryApiClient.patch("/delivery/availability", {
    isAvailable,
  });
  return data;
}

export async function getAvailableOrders() {
  const { data } = await deliveryApiClient.get("/delivery/orders/available");
  return data;
}

export async function getAvailableDeliveries() {
  return getAvailableOrders();
}

export async function getMyDeliveries() {
  const { data } = await deliveryApiClient.get("/delivery/my-deliveries");
  return data;
}

export async function acceptOrder(orderId: string) {
  const { data } = await deliveryApiClient.patch(
    `/delivery/orders/${orderId}/accept`
  );
  return data;
}

export async function acceptDeliveryOrder(orderId: string) {
  return acceptOrder(orderId);
}

export async function rejectOrder(orderId: string) {
  const { data } = await deliveryApiClient.patch(
    `/delivery/orders/${orderId}/reject`
  );
  return data;
}