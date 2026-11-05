// lib/utils/subscription.ts
export type SubscriptionState = "none" | "expired" | "expiring" | "active";

const EXPIRING_SOON_DAYS = 7;

/** What a restaurant with no plan yet can still use; an expired plan locks everything. */
export const NO_PLAN_PATHS = ["/owner/dashboard", "/owner/orders", "/owner/menu"];

interface SubscriptionPayload {
  status?: string;
  daysRemaining?: number | null;
}

/** Maps the server's subscription payload (ACTIVE / EXPIRED / CANCELLED / NO_SUBSCRIPTION + daysRemaining) to what the UI cares about. */
export function getSubscriptionState(sub: SubscriptionPayload | null | undefined): SubscriptionState | null {
  if (!sub) return null;
  if (sub.status === "NO_SUBSCRIPTION") return "none";
  if (sub.status === "EXPIRED" || sub.status === "CANCELLED") return "expired";
  if (typeof sub.daysRemaining === "number" && sub.daysRemaining <= 0) return "expired";
  if (typeof sub.daysRemaining === "number" && sub.daysRemaining <= EXPIRING_SOON_DAYS) return "expiring";
  return "active";
}

/** When access ends after paying for `durationMonths`, mirroring how the server renews (extends a live subscription, else starts today). */
export function accessUntil(currentExpiry: string | null | undefined, durationMonths: number, now = new Date()): Date | null {
  if (durationMonths === 0) return null;
  const current = currentExpiry ? new Date(currentExpiry) : null;
  const result = new Date(current && current > now ? current : now);
  result.setMonth(result.getMonth() + durationMonths);
  return result;
}
