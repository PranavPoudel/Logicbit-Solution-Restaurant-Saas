// lib/api/roles-permissions.ts — Module 5: Roles & Permissions (Owner RBAC)
import { ownerApiClient } from "@/lib/api/owner-client";

// Field names confirmed against server CreateRoleDto — only "name" exists.
// The server's ValidationPipe uses forbidNonWhitelisted: true, so sending
// any extra field (like the old "description") causes a 400 error.
export interface RoleInput {
  name: string;
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

// ---------------------------------------------------------------
// Staff (tenant users assigned to roles) — these live on the auth
// controller (POST/GET /auth/staff, PATCH /auth/staff/:id/deactivate),
// not on the roles controller, but they're the other half of "Roles &
// Permissions" from a UI perspective: roles exist to be assigned to staff.
// ---------------------------------------------------------------

export interface InviteStaffInput {
  name: string;
  email: string;
  password: string;
  phone?: string;
  roleIds: string[];
}

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  roles: string[];
  tenantId: string;
}

export async function inviteStaff(input: InviteStaffInput) {
  const { data } = await ownerApiClient.post("/auth/staff", input);
  return data;
}

export async function listStaff(): Promise<StaffMember[]> {
  const { data } = await ownerApiClient.get("/auth/staff");
  return data;
}

export async function deactivateStaff(userId: string) {
  const { data } = await ownerApiClient.patch(`/auth/staff/${userId}/deactivate`);
  return data;
}
