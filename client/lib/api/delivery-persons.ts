// lib/api/delivery-persons.ts

import { ownerApiClient } from "@/lib/api/owner-client";

export interface AddDeliveryPersonInput {
  name: string;
  phone: string;
  password: string;
  vehicleType?: string;
}

export async function addDeliveryPerson(
  input: AddDeliveryPersonInput
) {
  const { data } = await ownerApiClient.post("/delivery-persons", input);
  return data;
}

export async function listDeliveryPersons() {
  const { data } = await ownerApiClient.get("/delivery-persons");
  return data;
}