
export interface OrderItemDetail {
  id: string;
  menuItemId?: string;
  menuItem?: {
    name?: string;
  };
  name?: string;
  quantity?: number;
  price?: number;
  unitPrice?: number;
  subtotal?: number;
  selectedModifiers?: Array<{ name: string; price?: number }>;
}

export interface OrderRestaurant {
  id: string;
  name?: string;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface OrderDetail {
  id: string;
  restaurantId?: string;
  orderNumber?: string;
  status?: string;
  orderType?: string;

  subtotal?: number;
  deliveryFee?: number;
  discountAmount?: number;
  total?: number;

  items?: OrderItemDetail[];

  createdAt?: string;

  restaurant?: OrderRestaurant;

  deliveryPerson?: {
    fullName?: string;
    phone?: string;
  };

  customer?: {
    name?: string;
    phone?: string | null;
  };

  deliveryAddress?: string | null;
  deliveryLatitude?: number | null;
  deliveryLongitude?: number | null;
}

export const ORDER_STATUS_STEPS = [
  "PENDING",
  "ACCEPTED",
  "PREPARING",
  "READY",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
] as const;

export const PICKUP_STATUS_STEPS = ORDER_STATUS_STEPS.filter((s) => s !== "OUT_FOR_DELIVERY");
