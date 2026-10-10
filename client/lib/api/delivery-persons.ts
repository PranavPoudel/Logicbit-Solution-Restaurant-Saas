//lib/api/delivery-persons.ts
import { ownerApiClient } from "@/lib/api/owner-client";
import { useOwnerAuthStore } from "@/store/owner-auth-store";

export interface AddDeliveryPersonInput {
  name: string;
  phone: string;
  password: string;
  vehicleType?: string;
}

// Helper to safely get the active restaurant ID
const getActiveRestaurantId = () => {
  const restaurantId = useOwnerAuthStore.getState().activeRestaurantId;
  if (!restaurantId) {
    throw new Error("No active restaurant selected. Please select a restaurant first.");
  }
  return restaurantId;
};


export async function addDeliveryPerson(input: AddDeliveryPersonInput) {
  const { data } = await ownerApiClient.post(
    `/delivery-persons`, 
    input
  );
  return data;
}

export async function listDeliveryPersons() {
  const { data } = await ownerApiClient.get(
    `/delivery-persons`
  );
  return data;
}