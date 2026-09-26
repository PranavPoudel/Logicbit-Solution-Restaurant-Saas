// lib/api/tables.ts
import { ownerApiClient } from "@/lib/api/owner-client";

export interface RestaurantTable {
  id: string;
  name: string;
  capacity: number;
  zone?: string;
  isActive: boolean;
  displayOrder: number;
  deletedAt?: string;
  reservations?: { id: string }[];
}

export interface CreateTableDto {
  name: string;
  capacity: number;
  zone?: string;
  isActive?: boolean;
  displayOrder?: number;
}

export const tablesApi = {
  list: async (restaurantId: string, includeDeleted = false) =>
    (await ownerApiClient.get(`/restaurants/${restaurantId}/tables`, {
      params: { includeDeleted },
    })).data,

  create: async (restaurantId: string, dto: CreateTableDto) =>
    (await ownerApiClient.post(`/restaurants/${restaurantId}/tables`, dto)).data,

  update: async (restaurantId: string, id: string, dto: Partial<CreateTableDto>) =>
    (await ownerApiClient.patch(`/restaurants/${restaurantId}/tables/${id}`, dto)).data,

  remove: async (restaurantId: string, id: string) =>
    (await ownerApiClient.delete(`/restaurants/${restaurantId}/tables/${id}`)).data,

  restore: async (restaurantId: string, id: string) =>
    (await ownerApiClient.post(`/restaurants/${restaurantId}/tables/${id}/restore`)).data,

  permanentDelete: async (restaurantId: string, id: string) =>
    (await ownerApiClient.delete(`/restaurants/${restaurantId}/tables/${id}/permanent`)).data,
};