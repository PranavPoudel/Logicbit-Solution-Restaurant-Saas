/**
 * generateCouponCode()
 * ----------------------
 * Random, human-friendly coupon code बनाउँछ (जस्तै "SAVE-X7K2P9")।
 * Confusing character (0/O, 1/I) हटाइएको छ ताकि customer ले type गर्दा
 * गल्ती नहोस्।
 */
const SAFE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateCouponCode(prefix = 'SAVE', length = 6): string {
  let random = '';
  for (let i = 0; i < length; i++) {
    random += SAFE_CHARS[Math.floor(Math.random() * SAFE_CHARS.length)];
  }
  return `${prefix}-${random}`;
}
