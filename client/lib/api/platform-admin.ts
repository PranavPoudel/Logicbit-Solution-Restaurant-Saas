import { platformApiClient } from "@/lib/api/platform-client";

// --- Revenue & restaurants ---
export async function getRevenueSummary(startDate?: string, endDate?: string) {
  const { data } = await platformApiClient.get("/platform-admin/revenue-summary", {
    params: { startDate, endDate },
  });
  return data;
}

export async function getTopRestaurants() {
  const { data } = await platformApiClient.get("/platform-admin/top-restaurants");
  return data;
}

export async function listAllRestaurants(page?: number, limit?: number) {
  const { data } = await platformApiClient.get("/platform-admin/restaurants", {
    params: { page, limit },
  });
  return data;
}

export async function getRestaurantFullDetail(id: string) {
  const { data } = await platformApiClient.get(`/platform-admin/restaurants/${id}`);
  return data;
}

// Emergency full-control override — TODO: confirm shape, blueprint calls
// this a raw JSON editor ("Emergency use only").
export async function overrideRestaurant(id: string, override: Record<string, unknown>) {
  const { data } = await platformApiClient.patch(
    `/platform-admin/restaurants/${id}/override`,
    override
  );
  return data;
}

export async function suspendRestaurant(id: string, suspend: boolean) {
  const { data } = await platformApiClient.patch(`/platform-admin/restaurants/${id}/suspend`, {
    suspend,
  });
  return data;
}

export async function setRestaurantCommission(id: string, percent: number) {
  const { data } = await platformApiClient.patch(
    `/platform-admin/restaurants/${id}/commission`,
    { percent }
  );
  return data;
}

// --- Moderation ---
export async function deleteStorefrontBanner(id: string) {
  const { data } = await platformApiClient.delete(`/platform-admin/storefront-banners/${id}`);
  return data;
}

// --- Deliveries & activity ---
export async function listAllDeliveries() {
  const { data } = await platformApiClient.get("/platform-admin/deliveries");
  return data;
}

export async function getRestaurantActivityLogs(restaurantId: string) {
  const { data } = await platformApiClient.get(
    `/platform-admin/restaurants/${restaurantId}/activity-logs`
  );
  return data;
}

export async function getAllActivityLogs(page?: number, limit?: number) {
  const { data } = await platformApiClient.get("/platform-admin/activity-logs", {
    params: { page, limit },
  });
  return data;
}

export interface OwnerStats {
  orders: number;
  sales: number;
  commission: number;
}

export interface OwnerRestaurantStats extends OwnerStats {
  id: string;
  name: string;
}

export interface OwnerOverview extends OwnerStats {
  tenantId: string;
  owner: { name: string; email: string; phone: string | null } | null;
  restaurants: OwnerRestaurantStats[];
}

export async function getOwnersOverview(): Promise<OwnerOverview[]> {
  const { data } = await platformApiClient.get("/platform-admin/owners-overview");
  return data?.data || data;
}

// --- Refunds ---
export async function listPendingRefunds() {
  const { data } = await platformApiClient.get("/platform-admin/refunds/pending");
  return data;
}

export async function processRefund(id: string, approved: boolean) {
  const { data } = await platformApiClient.patch(`/platform-admin/refunds/${id}/process`, {
    approved,
  });
  return data;
}

// --- Platform Staff / Role management ---
export async function listPlatformPermissions() {
  const { data } = await platformApiClient.get("/platform-admin/staff/permissions");
  return data;
}

export async function listPlatformRoles() {
  const { data } = await platformApiClient.get("/platform-admin/staff/roles");
  return data;
}

export interface PlatformRoleInput {
  name: string;
  description?: string;
}

export async function createPlatformRole(input: PlatformRoleInput) {
  const { data } = await platformApiClient.post("/platform-admin/staff/roles", input);
  return data;
}

export async function addPermissionToPlatformRole(roleId: string, permissionId: string) {
  const { data } = await platformApiClient.post(
    `/platform-admin/staff/roles/${roleId}/permissions/${permissionId}`
  );
  return data;
}

export async function listPlatformStaff() {
  const { data } = await platformApiClient.get("/platform-admin/staff");
  return data;
}

export interface AddPlatformStaffInput {
  fullName: string;
  email: string;
  password: string;
  roleId?: string;
}

export async function addPlatformStaff(input: AddPlatformStaffInput) {
  const { data } = await platformApiClient.post("/platform-admin/staff", input);
  return data;
}

export async function updatePlatformStaff(id: string, input: Partial<AddPlatformStaffInput>) {
  const { data } = await platformApiClient.patch(`/platform-admin/staff/${id}`, input);
  return data;
}


// --- Promotions & Storefront Limits ---

export interface PromotionLimits {
  maxActivePromotions?: number;
  maxDiscountCap?: number;
  allowedCouponTypes?: ("PERCENTAGE" | "FLAT")[];
  maxActiveBanners?: number;
  maxActivePopups?: number;
}

export async function updateRestaurantPromotionLimits(id: string, limits: PromotionLimits) {
  const { data } = await platformApiClient.patch(
    `/platform-admin/promotions/restaurant/${id}/limits`,
    limits
  );
  return data;
}

export async function reviewPendingPromotion(couponId: string, status: 'APPROVED' | 'REJECTED') {
  const { data } = await platformApiClient.patch(
    `/platform-admin/promotions/${couponId}/review`,
    { status }
  );
  return data;
}

export async function listPendingPromotions() {
  const { data } = await platformApiClient.get("/platform-admin/promotions/pending");
  return data;
}

// --- Manual Subscription Override ---
export async function listSubscriptionPlans() {
  const { data } = await platformApiClient.get("/platform-admin/subscriptions/plans");
  return data;
}

export interface AssignSubscriptionInput {
  restaurantId: string;
  planId: string;
  mode: 'MANUAL' | 'AUTO';
}

export async function assignManualSubscription(input: AssignSubscriptionInput) {
  const { data } = await platformApiClient.post("/platform-admin/subscriptions/manual-assign", input);
  return data;
}