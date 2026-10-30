import { createHmac, timingSafeEqual } from 'crypto';

const PURPOSE = 'email-unsubscribe';

function secret() {
  return process.env.JWT_ACCESS_SECRET || 'dev-only-secret';
}

function sign(payload: string) {
  return createHmac('sha256', secret()).update(`${PURPOSE}.${payload}`).digest('base64url');
}

export function createUnsubscribeToken(customerId: string, restaurantId: string) {
  const payload = Buffer.from(`${customerId}.${restaurantId}`).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

export function readUnsubscribeToken(token: string): { customerId: string; restaurantId: string } | null {
  const [payload, signature, ...rest] = token.split('.');
  if (!payload || !signature || rest.length) return null;

  const expected = Buffer.from(sign(payload));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;

  const [customerId, restaurantId, ...extra] = Buffer.from(payload, 'base64url').toString().split('.');
  if (!customerId || !restaurantId || extra.length) return null;
  return { customerId, restaurantId };
}

export function unsubscribeUrl(customerId: string, restaurantId: string) {
  const base = process.env.APP_URL || process.env.CORS_ORIGIN?.split(',')[0] || 'http://localhost:3000';
  return `${base.replace(/\/$/, '')}/unsubscribe?token=${encodeURIComponent(createUnsubscribeToken(customerId, restaurantId))}`;
}
