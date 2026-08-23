// lib/api/roles-permissions.ts — Module 5: Roles & Permissions (Owner RBAC)
import { ownerApiClient } from "@/lib/api/owner-client";

// TODO: confirm exact DTO field names via Swagger for role create/update body.
export interface RoleInput {
  name: string;
  description?: string;
}

export async function createRole(input: RoleInput) {
  const { data } = await ownerApiClient.post("/roles", input);
  return data;
}

export async function listRoles() {
  const { data } = await ownerApiClient.get("/roles");
  return data;
}

export async function getRole(id: string) {
  const { data } = await ownerApiClient.get(`/roles/${id}`);
  return data;
}

export async function updateRole(id: string, input: RoleInput) {
  const { data } = await ownerApiClient.put(`/roles/${id}`, input);
  return data;
}

export async function deleteRole(id: string) {
  const { data } = await ownerApiClient.delete(`/roles/${id}`);
  return data;
}

export async function addPermissionToRole(roleId: string, permissionId: string) {
  const { data } = await ownerApiClient.post(
    `/roles/${roleId}/permissions/${permissionId}`
  );
  return data;
}

export async function removePermissionFromRole(roleId: string, permissionId: string) {
  const { data } = await ownerApiClient.delete(
    `/roles/${roleId}/permissions/${permissionId}`
  );
  return data;
}

export async function listPermissions() {
  const { data } = await ownerApiClient.get("/permissions");
  return data;
}

export async function getPermission(id: string) {
  const { data } = await ownerApiClient.get(`/permissions/${id}`);
  return data;
}

// NOTE: create/update/delete permission require MANAGE_PLATFORM_STAFF —
// i.e. platform-level auth, not owner. These are here for reference but
// likely need platformApiClient once the Platform Admin portal is wired.
export interface PermissionInput {
  name: string;
  description?: string;
}

export async function createPermission(input: PermissionInput) {
  const { data } = await ownerApiClient.post("/permissions", input);
  return data;
}

export async function updatePermission(id: string, input: PermissionInput) {
  const { data } = await ownerApiClient.put(`/permissions/${id}`, input);
  return data;
}

export async function deletePermission(id: string) {
  const { data } = await ownerApiClient.delete(`/permissions/${id}`);
  return data;
}
