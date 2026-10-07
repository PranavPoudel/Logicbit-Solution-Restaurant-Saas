// lib/api/orders.ts
import { apiClient } from "@/lib/api/client";
import { ownerApiClient } from "@/lib/api/owner-client";
import type { OrderDetail } from "@/types/order";

// ✅ STRICTLY MATCHES BACKEND CreateOrderDto & OrderItemInputDto
// Removed 'name' and 'extraPrice' to prevent forbidNonWhitelisted 400 errors.
export interface CheckoutInput {
  restaurantId: string;
  orderType: "DELIVERY" | "PICKUP" | "DINE_IN";
  paymentMethod: "COD" | "CREDIT_CARD" | "ESEWA" | "KHALTI" | "IPS" | "PHONEPAY";
  couponCode?: string;
  deliveryAddress?: string;
  deliveryLatitude?: number;
  deliveryLongitude?: number;
  items: Array<{
    menuItemId: string;
    quantity: number;
    selectedModifiers?: Array<{
      modifierGroupId: string;
      modifierOptionId: string;
    }>;
  }>;
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

export async function rejectRider(restaurantId: string, orderId: string) {
  const { data } = await ownerApiClient.patch(
    `/restaurants/${restaurantId}/orders/${orderId}/reject-rider`
  );
  return data;
}

export async function cancelRestaurantOrder(restaurantId: string, orderId: string) {
  const { data } = await ownerApiClient.patch(
    `/restaurants/${restaurantId}/orders/${orderId}/cancel`
  );
  return data;
}

export interface CouponPreview {
  code: string;
  discountAmount: number;
}

export async function validateCoupon(
  restaurantId: string,
  code: string,
  subtotal: number
): Promise<CouponPreview> {
  const { data } = await apiClient.post("/orders/validate-coupon", {
    restaurantId,
    code,
    subtotal,
  });
  return data;
}
export async function getOrderById(restaurantId: string, orderId: string) {
  const { data } = await ownerApiClient.get(`/restaurants/${restaurantId}/orders/${orderId}`);
  return data;
}

export const getUnprintedOrders = async (restaurantId: string) => {
  const response = await ownerApiClient.get(`/restaurants/${restaurantId}/orders/unprinted`);
  return response.data; // Interceptor unwraps { success, data, message }
};

export const markOrderAsPrinted = async (restaurantId: string, orderId: string) => {
  const response = await ownerApiClient.patch(`/restaurants/${restaurantId}/orders/${orderId}/print`);
  return response.data;
};