import { platformApiClient } from "@/lib/api/platform-client";

export interface Delivery {
  id: string;
  orderId: string;
  status: 'UNASSIGNED' | 'ASSIGNED' | 'PICKED_UP' | 'ON_THE_WAY' | 'DELIVERED' | 'FAILED';
  earningAmount: number;
  createdAt: string;
  order?: {
    orderNumber: string;
    total: number;
    deliveryAddress: string;
    restaurant?: { name: string };
    customer?: { name: string; phone: string };
  };
  deliveryPerson?: {
    id: string;
    name: string;
    phone: string;
    vehicleType?: string;
  };
}

export interface Rider {
  id: string;
  name: string;
  phone: string;
  email?: string;
  vehicleType?: string;
  isAvailable: boolean;
  isActive: boolean;
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  _count?: {
    deliveries: number;
  };
}

export async function getAllDeliveries(status?: string): Promise<Delivery[]> {
  const res = await platformApiClient.get('/platform-admin/deliveries', {
    params: { status },
  });
  return res.data?.data || res.data;
}

export async function getAllRiders(approvalStatus?: string): Promise<Rider[]> {
  const res = await platformApiClient.get('/platform-admin/riders', {
    params: { approvalStatus },
  });
  return res.data?.data || res.data;
}

export async function toggleRiderLock(id: string, isActive: boolean) {
  const res = await platformApiClient.patch(`/platform-admin/riders/${id}/lock`, { isActive });
  return res.data;
}

export async function reviewRiderApproval(id: string, status: 'APPROVED' | 'REJECTED') {
  const res = await platformApiClient.patch(`/platform-admin/riders/${id}/approval`, { status });
  return res.data;
}