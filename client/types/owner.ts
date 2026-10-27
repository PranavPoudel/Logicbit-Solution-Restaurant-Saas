// types/owner.ts
import type { DayHours } from "@/types/hours";

/**
 * Owner-portal user — confirmed shape from POST /auth/login response.
 */
export interface OwnerUser {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  tenantId: string;
  roles?: string[];
}

export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  coverImageUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  isOpen?: boolean;
  isActive?: boolean;
  openingHours?: DayHours[] | null;
  timezone?: string;
}

export interface RestaurantSubscription {
  planName: string;
  status: "active" | "expiring" | "expired" | "trial";
  expiresAt: string; // ISO date
  daysRemaining: number;
}

export interface OwnerAuthTokens {
  accessToken: string;
  refreshToken: string;
}

// Confirmed real shape: POST /auth/login (after the global {success,data}
// envelope unwrap) returns { user, tenant, tokens: { accessToken,
// refreshToken, expiresIn } } — note `user.name`, not `user.fullName`, and
// tokens are nested, not top-level.
export interface OwnerLoginApiResponse {
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    roles?: string[];
    tenantId: string;
  };
  tenant?: { id: string; name: string };
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn?: string;
  };
}

/** Dashboard summary widgets — shape is a placeholder until we confirm the
 * real analytics endpoint (blueprint doesn't specify one explicitly yet). */
export interface DashboardSummary {
  todayOrderCount: number;
  todayRevenue: number;
  pendingOrderCount: number;
  revenueTrend: Array<{ date: string; revenue: number }>;
}
