// lib/api/customer-auth.ts
import { apiClient } from "@/lib/api/client";
import type { CustomerAuthResponse } from "@/types/api";
import type { CustomerLoginInput, CustomerSignupInput } from "@/lib/validation/auth-schemas";

// Helper to normalize the backend response, handling nested tokens
function normalizeAuthResponse(data: any): CustomerAuthResponse {
  return {
    // Extract from top level OR nested 'tokens' object (common NestJS pattern)
    accessToken: data.accessToken || data.tokens?.accessToken,
    refreshToken: data.refreshToken || data.tokens?.refreshToken,
    // Extract customer/user data
    customer: data.customer || data.user,
  } as CustomerAuthResponse;
}

export async function customerLogin(
  input: CustomerLoginInput
): Promise<CustomerAuthResponse> {
  const { data } = await apiClient.post<any>("/customer-auth/login", input);
  return normalizeAuthResponse(data);
}

export async function customerSignup(
  input: Omit<CustomerSignupInput, "confirmPassword">
): Promise<CustomerAuthResponse> {
  const backendPayload = {
    name: input.fullName, // Mapping 'fullName' to 'name'
    email: input.email,
    phone: input.phone,
    password: input.password,
  };

  const { data } = await apiClient.post<any>("/customer-auth/register", backendPayload);
  return normalizeAuthResponse(data);
}

export async function customerGuestCheckout(): Promise<CustomerAuthResponse> {
  const { data } = await apiClient.post<any>("/customer-auth/guest");
  return normalizeAuthResponse(data);
}