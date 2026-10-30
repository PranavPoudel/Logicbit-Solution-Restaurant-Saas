// lib/api/unsubscribe.ts
import { apiClient } from "@/lib/api/client";

export interface UnsubscribeStatus {
  restaurantName: string;
  unsubscribed: boolean;
}

export const unsubscribeApi = {
  status: async (token: string): Promise<UnsubscribeStatus> => (await apiClient.get("/email-unsubscribe", { params: { token } })).data,
  unsubscribe: async (token: string): Promise<UnsubscribeStatus> => (await apiClient.post("/email-unsubscribe", { token })).data,
  resubscribe: async (token: string): Promise<UnsubscribeStatus> => (await apiClient.post("/email-unsubscribe/resubscribe", { token })).data,
};
