// lib/api/owner-auth.ts
import { ownerApiClient } from "@/lib/api/owner-client";
import type { OwnerLoginApiResponse } from "@/types/owner";
import type { OwnerLoginInput } from "@/lib/validation/auth-schemas";

// Confirmed shape (see types/owner.ts OwnerLoginApiResponse) — tokens are
// nested under `tokens`, and the user's name field is `name`, not
// `fullName`. The login page maps this into the owner-auth-store shape.
export async function ownerLogin(
  input: OwnerLoginInput
): Promise<OwnerLoginApiResponse> {
  const { data } = await ownerApiClient.post<OwnerLoginApiResponse>(
    "/auth/login",
    input
  );
  return data;
}

// --- remaining Module 1 endpoints ---

export interface OwnerRegisterInput {
  tenantName: string;
  restaurantName: string;
  fullName: string;
  email: string;
  password: string;
  phone?: string;
}

export async function ownerRegister(input: OwnerRegisterInput) {
  const { data } = await ownerApiClient.post("/auth/register", input);
  return data;
}

export async function getOwnerProfile() {
  const { data } = await ownerApiClient.get("/auth/profile");
  return data;
}

export interface AddStaffInput {
  fullName: string;
  email: string;
  password: string;
  roleId: string;
}

export async function addStaff(input: AddStaffInput) {
  const { data } = await ownerApiClient.post("/auth/staff", input);
  return data;
}

export async function listStaff() {
  const { data } = await ownerApiClient.get("/auth/staff");
  return data;
}

export async function deactivateStaff(userId: string) {
  const { data } = await ownerApiClient.patch(`/auth/staff/${userId}/deactivate`);
  return data;
}
