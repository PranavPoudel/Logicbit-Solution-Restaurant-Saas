// lib/api/customer-auth.ts
import { apiClient } from "@/lib/api/client";
import type { Customer, CustomerAuthResponse } from "@/types/api";
import type { CustomerLoginInput, CustomerSignupInput } from "@/lib/validation/auth-schemas";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3700/api/v1";

/** What the customer-auth endpoints send back (the API envelope is already unwrapped by the client). */
interface AuthPayload {
  accessToken?: string;
  refreshToken?: string;
  tokens?: { accessToken?: string; refreshToken?: string };
  customer?: Customer;
  user?: Customer;
  needsVerification?: boolean;
}

// Helper to normalize the backend response, handling nested tokens
function normalizeAuthResponse(data: AuthPayload): CustomerAuthResponse {
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
  const { data } = await apiClient.post<AuthPayload>("/customer-auth/login", input);
  return normalizeAuthResponse(data);
}

/** What sign-up returns: a session unless the server wants the email confirmed first. */
export interface CustomerSignupResult {
  customer: Customer;
  auth: CustomerAuthResponse | null;
  needsVerification: boolean;
}

export async function customerSignup(
  input: Omit<CustomerSignupInput, "confirmPassword">
): Promise<CustomerSignupResult> {
  const backendPayload = {
    name: input.fullName, // Mapping 'fullName' to 'name'
    email: input.email,
    phone: input.phone,
    password: input.password,
  };

  const { data } = await apiClient.post<AuthPayload>("/customer-auth/register", backendPayload);
  return {
    customer: (data.customer || data.user) as Customer,
    auth: data.tokens?.accessToken ? normalizeAuthResponse(data) : null,
    needsVerification: Boolean(data.needsVerification),
  };
}

export async function customerGuestCheckout(): Promise<CustomerAuthResponse> {
  const { data } = await apiClient.post<AuthPayload>("/customer-auth/guest");
  return normalizeAuthResponse(data);
}

// ---- Emailed codes: confirm the email, reset the password ----

export async function customerVerifyEmail(input: { email: string; code: string }) {
  await apiClient.post("/customer-auth/verify-email", input);
}

export async function customerResendVerification(email: string) {
  await apiClient.post("/customer-auth/resend-verification", { email });
}

export async function customerForgotPassword(email: string) {
  await apiClient.post("/customer-auth/forgot-password", { email });
}

export async function customerResetPassword(input: { email: string; code: string; newPassword: string }) {
  await apiClient.post("/customer-auth/reset-password", input);
}

// ---- Google login ----

/** Opened by navigating the browser (not fetch): the API redirects on to Google. */
export const googleLoginUrl = (locale: string) =>
  `${API_BASE_URL}/customer-auth/google?locale=${encodeURIComponent(locale)}`;

/** Swaps the single-use code from the callback address for a normal login. */
export async function customerGoogleExchange(code: string): Promise<CustomerAuthResponse> {
  const { data } = await apiClient.post<AuthPayload>("/customer-auth/google/exchange", { code });
  return normalizeAuthResponse(data);
}
