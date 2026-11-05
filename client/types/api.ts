// types/api.ts

/**
 * Generic wrapper for standard success responses.
 * NOTE: adjust this shape once we hit real endpoints in Swagger and see the
 * actual envelope (some NestJS setups wrap in { data, message }, others don't).
 */
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  statusCode: number;
  message: string | string[];
  error?: string;
}

/**
 * Customer entity — fields based on typical NestJS customer-auth setups.
 * We will confirm exact field names against /api/v1/customer-auth responses
 * when we build the login page.
 */
export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  emailVerified?: boolean;
  createdAt?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface CustomerAuthResponse extends AuthTokens {
  customer: Customer;
}
