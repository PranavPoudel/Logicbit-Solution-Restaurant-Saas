import { platformApiClient } from "@/lib/api/platform-client";

export type RefundStatus = "PENDING" | "APPROVED" | "REJECTED" | "PROCESSED";

export interface RefundRequest {
  id: string;
  status: RefundStatus;
  reason?: string;
  createdAt: string;
  processedAt?: string;
  order?: {
    orderNumber: string;
    total: number;
    paymentMethod: string;
    customer?: {
      name: string;
      email: string;
    };
    restaurant?: {
      name: string;
    };
  };
}

export async function getPendingRefunds(): Promise<RefundRequest[]> {
  const { data } = await platformApiClient.get("/refunds/pending");
  return data;
}

export async function processRefund(
  id: string,
  status: RefundStatus,
  reason?: string
): Promise<RefundRequest> {
  const { data } = await platformApiClient.patch(`/refunds/${id}/process`, {
    status,
    reason,
  });
  return data;
}