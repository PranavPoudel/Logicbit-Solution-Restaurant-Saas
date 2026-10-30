import { apiClient } from "@/lib/api/client";
import { platformApiClient } from "@/lib/api/platform-client";

export interface City {
  id: string;
  name: string;
  nameJa?: string | null;
  country: string;
  latitude: number;
  longitude: number;
  displayOrder: number;
  isActive: boolean;
}

export interface CityInput {
  name: string;
  nameJa?: string;
  country: string;
  latitude: number;
  longitude: number;
  displayOrder?: number;
  isActive?: boolean;
}

export async function listCities(): Promise<City[]> {
  const { data } = await apiClient.get<City[]>("/discovery/cities");
  return data;
}

export async function getPlatformCities(): Promise<City[]> {
  const { data } = await platformApiClient.get("/platform-admin/cities");
  return data;
}

export async function createCity(input: CityInput) {
  const { data } = await platformApiClient.post("/platform-admin/cities", input);
  return data;
}

export async function updateCity(id: string, input: Partial<CityInput>) {
  const { data } = await platformApiClient.patch(`/platform-admin/cities/${id}`, input);
  return data;
}

export async function deleteCity(id: string) {
  const { data } = await platformApiClient.delete(`/platform-admin/cities/${id}`);
  return data;
}
