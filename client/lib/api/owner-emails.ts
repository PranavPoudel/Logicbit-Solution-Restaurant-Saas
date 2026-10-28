// lib/api/owner-emails.ts
import { ownerApiClient } from "@/lib/api/owner-client";

export interface EmailCustomer {
  id: string;
  name: string;
  email: string;
  orders: number;
}

export type EmailOrderStatus =
  | "PENDING"
  | "ACCEPTED"
  | "PREPARING"
  | "READY"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "COMPLETED"
  | "CANCELLED";

export interface EmailOrder {
  id: string;
  number: string;
  customerId: string;
  customerName?: string;
  items: string;
  total: number;
  status: EmailOrderStatus;
  placedAt: string;
}

export interface SendEmailInput {
  audience: "ALL" | "ONE";
  customerId?: string;
  orderId?: string;
  subject: string;
  body: string;
}

export interface SentEmail {
  id: string;
  subject: string;
  audience: "ALL" | "ONE";
  recipientLabel: string;
  recipientCount: number;
  orderNumber?: string;
  sentAt: string;
}

const base = (restaurantId: string) => `/restaurants/${restaurantId}/customer-emails`;

export const ownerEmailsApi = {
  customers: async (restaurantId: string): Promise<EmailCustomer[]> =>
    (await ownerApiClient.get(`${base(restaurantId)}/customers`)).data,
  recentOrders: async (restaurantId: string): Promise<EmailOrder[]> =>
    (await ownerApiClient.get(`${base(restaurantId)}/orders`)).data,
  orders: async (restaurantId: string, customerId: string): Promise<EmailOrder[]> =>
    (await ownerApiClient.get(`${base(restaurantId)}/customers/${customerId}/orders`)).data,
  history: async (restaurantId: string): Promise<SentEmail[]> =>
    (await ownerApiClient.get(`${base(restaurantId)}/history`)).data,
  send: async (restaurantId: string, input: SendEmailInput): Promise<SentEmail> =>
    (await ownerApiClient.post(`${base(restaurantId)}/send`, input)).data,
};
