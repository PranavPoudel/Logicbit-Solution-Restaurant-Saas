// lib/api/delivery-partners.ts
import { ownerApiClient } from "@/lib/api/owner-client";

export type DeliveryPartnerFeeType = "FLAT" | "PERCENT";
export type ConnectionStatus = "NOT_CONNECTED" | "CONNECTED" | "FAILED";

export interface DeliveryPartner {
  id: string;
  name: string;
  contactName?: string | null;
  contactPhone?: string | null;
  accountId?: string | null;
  feeType: DeliveryPartnerFeeType;
  feeValue: number;
  notes?: string | null;
  isActive: boolean;
  connectionStatus?: ConnectionStatus;
  connectionError?: string | null;
}

export type DeliveryPartnerInput = Pick<DeliveryPartner, "name"> & Partial<Omit<DeliveryPartner, "id" | "name" | "connectionStatus" | "connectionError">>;

export interface ConnectionResult {
  status: ConnectionStatus;
  message?: string;
}

const base = (restaurantId: string) => `/restaurants/${restaurantId}/delivery-partners`;

export const deliveryPartnersApi = {
  list: async (restaurantId: string): Promise<DeliveryPartner[]> =>
    (await ownerApiClient.get(base(restaurantId))).data,

  create: async (restaurantId: string, input: DeliveryPartnerInput) =>
    (await ownerApiClient.post(base(restaurantId), input)).data,

  update: async (restaurantId: string, id: string, input: Partial<DeliveryPartnerInput>) =>
    (await ownerApiClient.patch(`${base(restaurantId)}/${id}`, input)).data,

  remove: async (restaurantId: string, id: string) =>
    (await ownerApiClient.delete(`${base(restaurantId)}/${id}`)).data,

  connect: async (restaurantId: string, id: string, credentials: Record<string, string>): Promise<ConnectionResult> =>
    (await ownerApiClient.put(`${base(restaurantId)}/${id}/connection`, { credentials })).data,

  oauthStart: async (restaurantId: string, id: string): Promise<{ url: string }> =>
    (await ownerApiClient.get(`${base(restaurantId)}/${id}/connection/oauth`)).data,

  testConnection: async (restaurantId: string, id: string): Promise<ConnectionResult> =>
    (await ownerApiClient.post(`${base(restaurantId)}/${id}/connection/test`)).data,

  disconnect: async (restaurantId: string, id: string) =>
    (await ownerApiClient.delete(`${base(restaurantId)}/${id}/connection`)).data,
};

export function connectionErrorMessage(e: { response?: { status?: number; data?: { message?: string | string[] } } }) {
  const status = e.response?.status;
  if (status === 404 || status === 501) return "Connecting isn't available yet. The service is saved, and you can connect it once this is ready.";
  const message = e.response?.data?.message;
  return (Array.isArray(message) ? message.join(", ") : message) || "Something went wrong. Please try again.";
}
