// types/order.ts

export interface OrderItemDetail {
  id: string;
  menuItemId?: string;
  menuItem?: { name?: string };
  name?: string;
  quantity?: number;
  price?: number;
  unitPrice?: number;
  subtotal?: number;
}

export interface OrderDetail {
  id: string;
  orderNumber?: string;
  status?: string;
  orderType?: string;
  subtotal?: number;
  deliveryFee?: number;
  discountAmount?: number;
  total?: number;
  items?: OrderItemDetail[];
  createdAt?: string;
  restaurant?: { id: string; name?: string };
  deliveryPerson?: { fullName?: string; phone?: string };
  deliveryAddress?: string;
}

// Order status progression used to render the tracking timeline.
// Confirmed against a live backend error (Prisma OrderStatus enum
// rejected "PLACED") — the real flow is PENDING → ACCEPTED → PREPARING →
// READY → OUT_FOR_DELIVERY → DELIVERED.
export const ORDER_STATUS_STEPS = [
  "PENDING",
  "ACCEPTED",
  "PREPARING",
  "READY",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
] as const;