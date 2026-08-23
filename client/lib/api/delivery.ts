// lib/api/delivery.ts — Module 13: Delivery (rider portal actions)
import { deliveryApiClient } from "@/lib/api/delivery-client";

export async function getAvailableDeliveries() {
  const { data } = await deliveryApiClient.get("/delivery/orders/available");
  return data;
}

export async function getMyDeliveries() {
  const { data } = await deliveryApiClient.get("/delivery/my-deliveries");
  return data;
}

export async function getMyEarnings() {
  const { data } = await deliveryApiClient.get("/delivery/earnings");
  return data;
}

export async function acceptDeliveryOrder(orderId: string) {
  const { data } = await deliveryApiClient.patch(`/delivery/orders/${orderId}/accept`);
  return data;
}

export async function rejectDeliveryOrder(orderId: string) {
  const { data } = await deliveryApiClient.patch(`/delivery/orders/${orderId}/reject`);
  return data;
}

export async function updateDeliveryOrderStatus(
  orderId: string,
  status: "PICKED_UP" | "ON_THE_WAY" | "DELIVERED"
) {
  const { data } = await deliveryApiClient.patch(`/delivery/orders/${orderId}/status`, {
    status,
  });
  return data;
}

export async function updateMyLocation(lat: number, lng: number) {
  const { data } = await deliveryApiClient.patch("/delivery/location", { lat, lng });
  return data;
}
