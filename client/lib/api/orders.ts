// lib/api/orders.ts — Module 10: Order
import { apiClient } from "@/lib/api/client";
import { ownerApiClient } from "@/lib/api/owner-client";
import type { OrderDetail } from "@/types/order";

// --- Customer side ---
// TODO: confirm exact checkout DTO via Swagger (items, addressId, couponCode,
// orderType, paymentMethod are the fields implied by the blueprint).
export interface CheckoutInput {
  restaurantId: string;
  items: Array<{
    menuItemId: string;
    quantity: number;
    selectedModifierOptionIds?: string[];
  }>;
  addressId?: string;
  couponCode?: string;
  orderType: "DELIVERY" | "PICKUP" | "DINE_IN";
  paymentMethod: "CASH_ON_DELIVERY";
  [key: string]: unknown;
}

export async function checkout(input: CheckoutInput) {
  const { data } = await apiClient.post("/orders", input);
  return data;
}

export async function listMyOrders() {
  const { data } = await apiClient.get("/orders");
  return data;
}

export async function getMyOrder(id: string): Promise<OrderDetail> {
  const { data } = await apiClient.get(`/orders/${id}`);
  if (process.env.NODE_ENV === "development") {
    // eslint-disable-next-line no-console
    console.log("[orders/:id] unwrapped payload:", data);
  }
  return data;
}

export async function cancelMyOrder(id: string) {
  const { data } = await apiClient.patch(`/orders/${id}/cancel`);
  return data;
}

// --- Owner side ---
export async function listRestaurantOrders(restaurantId: string, status?: string) {
  const { data } = await ownerApiClient.get(`/restaurants/${restaurantId}/orders`, {
    params: status ? { status } : undefined,
  });
  if (process.env.NODE_ENV === "development") {
    // eslint-disable-next-line no-console
    console.log("[restaurants/:id/orders] unwrapped payload:", data);
  }
  if (Array.isArray(data)) return data;
  return data?.orders ?? data?.data ?? [];
}

export async function getRestaurantOrder(restaurantId: string, orderId: string) {
  const { data } = await ownerApiClient.get(`/restaurants/${restaurantId}/orders/${orderId}`);
  if (process.env.NODE_ENV === "development") {
    // eslint-disable-next-line no-console
    console.log("[restaurants/:id/orders/:orderId] unwrapped payload:", data);
  }
  return data;
}

export async function updateOrderStatus(
  restaurantId: string,
  orderId: string,
  status: string
) {
  const { data } = await ownerApiClient.patch(
    `/restaurants/${restaurantId}/orders/${orderId}/status`,
    { status }
  );
  return data;
}

export async function cancelRestaurantOrder(restaurantId: string, orderId: string) {
  const { data } = await ownerApiClient.patch(
    `/restaurants/${restaurantId}/orders/${orderId}/cancel`
  );
  return data;
}
