// lib/api/auth.ts
import { apiClient } from "@/lib/api/client"; // Your base axios client

export interface OwnerRegisterInput {
  name: string;
  email: string;
  phone: string;
  password: string;
  restaurantName: string;
  restaurantAddress: string;
  acceptTerms: boolean;
}

export async function registerOwner(input: OwnerRegisterInput) {
  const { data } = await apiClient.post("/auth/register", input);
  return data;
}