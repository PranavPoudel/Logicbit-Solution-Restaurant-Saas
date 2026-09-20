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
  const restaurantId = getActiveRestaurantId();
  
  // ✅ Scoped to the specific restaurant
  const { data } = await ownerApiClient.post(
    `/restaurants/${restaurantId}/delivery-persons`, 
    input
  );
  return data;
}

export async function listDeliveryPersons() {
  const restaurantId = getActiveRestaurantId();
  
  // ✅ Scoped to the specific restaurant
  const { data } = await ownerApiClient.get(
    `/restaurants/${restaurantId}/delivery-persons`
  );
  return data;
}