// lib/api/reservations.ts
import { ownerApiClient } from "@/lib/api/owner-client";

export interface Reservation {
  id: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  partySize: number;
  reservationDate: string;
  reservationTime: string;
  durationMinutes: number;
  status: string;
  notes?: string;
  deletedAt?: string;
  table?: { name: string; capacity: number } | null;
}

export interface CreateReservationDto {
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  partySize: number;
  reservationDate: string;
  reservationTime: string;
  durationMinutes: number;
  tableId?: string;
  status?: string;
  notes?: string;
}

export const reservationsApi = {
  list: async (restaurantId: string, params?: { includeDeleted?: boolean; status?: string; date?: string }) =>
    (await ownerApiClient.get(`/restaurants/${restaurantId}/reservations`, { params })).data,

  create: async (restaurantId: string, dto: CreateReservationDto) =>
    (await ownerApiClient.post(`/restaurants/${restaurantId}/reservations`, dto)).data,

  update: async (restaurantId: string, id: string, dto: Partial<CreateReservationDto>) =>
    (await ownerApiClient.patch(`/restaurants/${restaurantId}/reservations/${id}`, dto)).data,

  remove: async (restaurantId: string, id: string) =>
    (await ownerApiClient.delete(`/restaurants/${restaurantId}/reservations/${id}`)).data,

  restore: async (restaurantId: string, id: string) =>
    (await ownerApiClient.post(`/restaurants/${restaurantId}/reservations/${id}/restore`)).data,

  permanentDelete: async (restaurantId: string, id: string) =>
    (await ownerApiClient.delete(`/restaurants/${restaurantId}/reservations/${id}/permanent`)).data,
};