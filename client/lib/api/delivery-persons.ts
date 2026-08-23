// lib/api/delivery-persons.ts — Module 13 (owner-facing part): Delivery Persons
import { ownerApiClient } from "@/lib/api/owner-client";

// TODO: confirm exact DTO via Swagger.
export interface AddDeliveryPersonInput {
  fullName: string;
  email: string;
  phone: string;
  password?: string;
}

export async function addDeliveryPerson(input: AddDeliveryPersonInput) {
  const { data } = await ownerApiClient.post("/delivery-persons", input);
  return data;
}

export async function listDeliveryPersons() {
  const { data } = await ownerApiClient.get("/delivery-persons");
  return data;
}
