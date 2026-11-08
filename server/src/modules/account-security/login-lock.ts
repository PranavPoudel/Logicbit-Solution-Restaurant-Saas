export const MAX_FAILED_LOGINS = 5;
export const LOCK_MINUTES = 10;

export function isLocked(account: { lockedUntil?: Date | null }, now = new Date()): boolean {
  return Boolean(account.lockedUntil && account.lockedUntil > now);
}

/** When a lock that starts now ends. */
export const lockExpiry = (now = new Date()) => new Date(now.getTime() + LOCK_MINUTES * 60_000);
