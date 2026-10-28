// types/order.ts

export interface OrderModifier {
  id?: string;
  name?: string;
  optionName?: string;
  price?: number;
  modifierGroupId?: string;
  modifierOptionId?: string;
}

export interface OrderItemDetail {
  id: string;
  menuItemId?: string;
  menuItem?: {
    id?: string;
    name?: string;
    allergenInfo?: string | null;
  };
  name?: string;
  quantity?: number;
  price?: number;
  unitPrice?: number;
  subtotal?: number;
  selectedModifiers?: OrderModifier[];
  notes?: string | null;
}

export interface OrderRestaurant {
  id: string;
  name?: string;
  address?: string | null;
  phone?: string | null;
  refundPolicy?: string | null;
  currencyCode?: string;
  latitude?: number | null;
  longitude?: number | null;
}

export interface OrderDelivery {
  id?: string;
  status?: string;
  assignedAt?: string;
  deliveredAt?: string;
  deliveryPerson?: {
    id?: string;
    name?: string;
    phone?: string;
    vehicleType?: string;
  };
  deliveryAddress?: string | null;
  deliveryLatitude?: number | null;
  deliveryLongitude?: number | null;
}

export interface OrderCustomer {
  id?: string;
  name?: string;
  phone?: string | null;
  email?: string | null;
}

export interface OrderDetail {
  id: string;
  restaurantId?: string;
  orderNumber?: string;
  status?: string;
  orderType?: "DELIVERY" | "PICKUP" | "DINE_IN";

  subtotal?: number;
  deliveryFee?: number;
  discountAmount?: number;
  total?: number;

  paymentStatus?: "UNPAID" | "PAID" | "REFUNDED";
  paymentMethod?: "COD" | "CREDIT_CARD" | "ESEWA" | "KHALTI" | "IPS" | "PHONEPAY" | "PAYPAY";

  items?: OrderItemDetail[];
  createdAt?: string;
  updatedAt?: string;

  restaurant?: OrderRestaurant;
  delivery?: OrderDelivery;
  customer?: OrderCustomer;

  deliveryAddress?: string | null;
  deliveryLatitude?: number | null;
  deliveryLongitude?: number | null;
  
  notes?: string | null;
}

// ✅ UPDATED: This is now the definitive shape for UI summary cards
export interface OrderSummary {
  id: string;
  orderNumber?: string;
  status?: string;
  orderType?: string;
  paymentMethod?: string;
  deliveryAddress?: string | null;
  deliveryHandledBy?: string;
  delivery?: {
    status?: string;
    assignedAt?: string;
    deliveredAt?: string;
    deliveryPerson?: { name?: string; phone?: string };
  };
  customer?: { name?: string; phone?: string };
  items?: Array<{
    menuItemId?: string;
    menuItem?: { name?: string };
    quantity?: number;
    unitPrice?: number;
    subtotal?: number;
    selectedModifiers?: Array<{ name?: string }>;
  }>;
  subtotal?: number;
  deliveryFee?: number;
  discountAmount?: number;
  couponCode?: string;
  total?: number;
  createdAt?: string;
  notes?: string | null;
}

export type OwnerOrderSummary = OrderSummary;

export const ORDER_STATUS_STEPS = [
  "PENDING",
  "ACCEPTED",
  "PREPARING",
  "READY",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
] as const;

export const PICKUP_STATUS_STEPS = ORDER_STATUS_STEPS.filter((s) => s !== "OUT_FOR_DELIVERY");