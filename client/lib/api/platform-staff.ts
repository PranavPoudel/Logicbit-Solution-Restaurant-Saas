import { platformApiClient } from "@/lib/api/platform-client";

export interface Permission {
  id: string;
  name: string;
  description?: string;
}

export interface Role {
  id: string;
  name: string;
  permissions: Permission[];
}

export async function getPlatformRoles(): Promise<Role[]> {
  const { data } = await platformApiClient.get("/platform-admin/staff/roles");
  return data?.data || data || [];
}

export async function getPlatformPermissions(): Promise<Permission[]> {
  const { data } = await platformApiClient.get("/platform-admin/staff/permissions");
  return data?.data || data || [];
}

export async function createPlatformRole(input: { name: string; permissionIds: string[] }) {
  const { data } = await platformApiClient.post("/platform-admin/staff/roles", input);
  return data;
}

export interface PlatformStaff {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  role?: {
    id: string;
    name: string;
  };
}

export async function getPlatformStaff(): Promise<PlatformStaff[]> {
  const { data } = await platformApiClient.get("/platform-admin/staff");
  return data?.data || data || [];
}

export async function createPlatformStaff(input: { name: string; email: string; roleId: string; password?: string }) {
  const { data } = await platformApiClient.post("/platform-admin/staff", input);
  return data;
}

export async function updatePlatformStaffStatus(id: string, isActive: boolean) {
  const { data } = await platformApiClient.patch(`/platform-admin/staff/${id}`, { isActive });
  return data;
}