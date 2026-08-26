// lib/api/customer-auth.ts
import { apiClient } from "@/lib/api/client";
import type { CustomerAuthResponse } from "@/types/api";
import type { CustomerLoginInput, CustomerSignupInput } from "@/lib/validation/auth-schemas";

// Paths confirmed: POST /customer-auth/login, POST /customer-auth/register.
// Response body shape (accessToken/refreshToken/customer fields) is still
// assumed — adjust CustomerAuthResponse in types/api.ts if Swagger shows
// different field names.

export async function customerLogin(
  input: CustomerLoginInput
): Promise<CustomerAuthResponse> {
  const { data } = await apiClient.post<CustomerAuthResponse>(
    "/customer-auth/login",
    input
  );
  return data;
}

export async function customerSignup(
  input: Omit<CustomerSignupInput, "confirmPassword">
): Promise<CustomerAuthResponse> {
  // Transforming the frontend payload to match the backend DTO exactly
  const backendPayload = {
    name: input.fullName, // Mapping 'fullName' to 'name'
    email: input.email,
    phone: input.phone,
    password: input.password,
    // any other fields the backend expects (e.g., address, etc.) if needed
  };

  // Sending the transformed payload
  const { data } = await apiClient.post<CustomerAuthResponse>(
    "/customer-auth/register",
    backendPayload
  );
  
  return data;
}

// --- remaining Module 2 endpoint ---

export async function customerGuestCheckout() {
  const { data } = await apiClient.post<CustomerAuthResponse>("/customer-auth/guest");
  return data;
}
