// lib/api/dashboard.ts
import { ownerApiClient } from "@/lib/api/owner-client"; 

// Fetch the owner's restaurant(s) to get the ID we need for scoping
export async function getOwnerRestaurants() {
  const { data } = await ownerApiClient.get("/restaurants");
  return data;
}

// Fetch recent orders for a specific restaurant
export async function getRecentOrders(restaurantId: string) {
  const { data } = await ownerApiClient.get(`/restaurants/${restaurantId}/orders?limit=5&sort=createdAt:desc`);
  return data;
}