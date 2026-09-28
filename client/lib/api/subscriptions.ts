  // lib/api/subscriptions.ts — Module 17: Subscription/Membership
  import { apiClient } from "@/lib/api/client";
  import { ownerApiClient } from "@/lib/api/owner-client";
  import { platformApiClient } from "@/lib/api/platform-client";

  // Owner — view
  export async function getRestaurantSubscription(restaurantId: string) {
    const { data } = await ownerApiClient.get(`/restaurants/${restaurantId}/subscription`);
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.log("[restaurants/:id/subscription] unwrapped payload:", data);
    }
    return data;
  }

  export async function setSubscriptionAutoRenew(restaurantId: string, autoRenew: boolean) {
    const { data } = await ownerApiClient.patch(
      `/restaurants/${restaurantId}/subscription/auto-renew`,
      { autoRenew }
    );
    return data;
  }

  // Platform — manage
  export interface SubscriptionPlanInput {
  name: string;
  price: number;        
  durationMonths: number;  
  isActive?: boolean;
}

  export interface SubscriptionPlan {
    id: string;
    name: string;
    price: number;           
    durationMonths: number;  
    isActive: boolean;
  }

  export async function createSubscriptionPlan(input: SubscriptionPlanInput) {
    const { data } = await platformApiClient.post("platform-admin/subscriptions/plans", input);
    return data;
  }

 export async function listSubscriptionPlans() {
  const { data } = await platformApiClient.get("/platform-admin/subscriptions/plans");
  return data;
}

  export async function listAllSubscriptions() {
    const { data } = await platformApiClient.get("/platform-admin/subscriptions");
    return data;
  }

  export async function listExpiringSoonSubscriptions() {
    const { data } = await platformApiClient.get(
      "/platform-admin/subscriptions/expiring-soon"
    );
    return data;
  }

  export async function renewRestaurantSubscription(restaurantId: string) {
    const { data } = await platformApiClient.post(
      `/platform-admin/subscriptions/restaurants/${restaurantId}/renew`
    );
    return data;
  }
