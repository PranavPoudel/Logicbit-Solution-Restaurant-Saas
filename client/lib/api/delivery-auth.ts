// lib/api/delivery-auth.ts — Rider Auth

import { deliveryApiClient } from "@/lib/api/delivery-client";

export interface DeliveryRegisterInput {
  name: string;
  phone: string;
  password: string;
  vehicleType?: string;
}

export interface DeliveryLoginInput {
  phone: string;
  password: string;
}

export async function deliveryRegister(input: DeliveryRegisterInput) {
  const { data } = await deliveryApiClient.post(
    "/delivery-auth/register",
    input
  );
  return data;
}

export async function deliveryLogin(input: DeliveryLoginInput) {
  const { data } = await deliveryApiClient.post(
    "/delivery-auth/login",
    input
  );
  return data;
}