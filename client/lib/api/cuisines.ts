// lib/api/cuisines.ts — Module 8: Cuisine
import { apiClient } from "@/lib/api/client";
import { ownerApiClient } from "@/lib/api/owner-client";
import { platformApiClient } from "@/lib/api/platform-client";

export interface Cuisine {
  id: string;
  name: string;
}

// Public — for dropdowns
export async function listCuisines(): Promise<Cuisine[]> {
  const { data } = await apiClient.get<Cuisine[]>("/discovery/cuisines");
  return data;
}

// Owner — own restaurant's cuisines
export async function getRestaurantCuisines(restaurantId: string) {
  const { data } = await ownerApiClient.get(`/restaurants/${restaurantId}/cuisines`);
  return data;
}

export async function setRestaurantCuisines(restaurantId: string, cuisineIds: string[]) {
  const { data } = await ownerApiClient.patch(`/restaurants/${restaurantId}/cuisines`, {
    cuisineIds,
  });
  return data;
}

// Platform admin — manage the master cuisine list
export interface CuisineInput {
  name: string;
}

export async function createCuisine(input: CuisineInput) {
  const { data } = await platformApiClient.post("/platform-admin/cuisines", input);
  return data;
}

export async function updateCuisine(id: string, input: Partial<CuisineInput>) {
  const { data } = await platformApiClient.patch(`/platform-admin/cuisines/${id}`, input);
  return data;
}

export async function deleteCuisine(id: string) {
  const { data } = await platformApiClient.delete(`/platform-admin/cuisines/${id}`);
  return data;
}
