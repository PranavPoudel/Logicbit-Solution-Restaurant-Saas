// lib/api/customers.ts — Module 18: Customer Self-Service
import { apiClient } from "@/lib/api/client";

export interface UpdateProfileInput {
  name?: string;
  phone?: string;
}

export async function updateMyProfile(input: UpdateProfileInput) {
  const { data } = await apiClient.patch("/customers/me/profile", input);
  return data;
}

export async function changeMyPassword(currentPassword: string, newPassword: string) {
  const { data } = await apiClient.patch("/customers/me/password", {
    currentPassword,
    newPassword,
  });
  return data;
}

export interface AddressInput {
  label: string;
  fullAddress: string;
  latitude: number;
  longitude: number;
}

export const addressesApi = {
  create: async (input: AddressInput) =>
    (await apiClient.post("/customers/me/addresses", input)).data,
  list: async () => (await apiClient.get("/customers/me/addresses")).data,
  update: async (id: string, input: Partial<AddressInput>) =>
    (await apiClient.patch(`/customers/me/addresses/${id}`, input)).data,
  remove: async (id: string) => (await apiClient.delete(`/customers/me/addresses/${id}`)).data,
};

export const favoritesApi = {
  add: async (restaurantId: string) =>
    (await apiClient.post("/customers/me/favorites", { restaurantId })).data,
  list: async () => (await apiClient.get("/customers/me/favorites")).data,
  remove: async (restaurantId: string) =>
    (await apiClient.delete(`/customers/me/favorites/${restaurantId}`)).data,
};
