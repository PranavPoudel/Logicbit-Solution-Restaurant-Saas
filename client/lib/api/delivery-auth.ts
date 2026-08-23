// lib/api/delivery-auth.ts — Module 3: Delivery Auth
import { deliveryApiClient } from "@/lib/api/delivery-client";

// TODO: confirm exact response field names via Swagger (assumed
// accessToken/refreshToken/deliveryPerson envelope, matching the other
// portals' pattern).
export interface DeliveryRegisterInput {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  vehicleType?: string;
}

export interface DeliveryLoginInput {
  email: string;
  password: string;
}

export async function deliveryRegister(input: DeliveryRegisterInput) {
  const { data } = await deliveryApiClient.post("/delivery-auth/register", input);
  return data;
}

export async function deliveryLogin(input: DeliveryLoginInput) {
  const { data } = await deliveryApiClient.post("/delivery-auth/login", input);
  return data;
}
