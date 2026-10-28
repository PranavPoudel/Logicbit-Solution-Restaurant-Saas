export interface OwnerOrderSummary {
  id: string;
  orderNumber?: string;
  status?: string;
  orderType?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  cancellationReason?: string;
  deliveryAddress?: string;
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
}
