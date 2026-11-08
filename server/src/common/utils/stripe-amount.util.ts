/**
 * Stripe takes amounts in the smallest unit of a currency: cents for USD, but whole yen for JPY.
 * Sending 1154 yen as 115400 would charge a hundred times too much, so every conversion goes through here.
 */

/** Currencies Stripe counts in whole units (no decimals). */
const ZERO_DECIMAL = new Set(['BIF', 'CLP', 'DJF', 'GNF', 'JPY', 'KMF', 'KRW', 'MGA', 'PYG', 'RWF', 'UGX', 'VND', 'VUV', 'XAF', 'XOF', 'XPF']);

/** Currencies Stripe counts in thousandths. Not supported: they need extra rounding rules nobody here sells in. */
const THREE_DECIMAL = new Set(['BHD', 'JOD', 'KWD', 'OMR', 'TND']);

export function isStripeCurrencySupported(currencyCode: string) {
  return !THREE_DECIMAL.has(currencyCode.toUpperCase());
}

export function toStripeAmount(amount: number, currencyCode: string): number {
  const code = currencyCode.toUpperCase();
  if (!isStripeCurrencySupported(code)) throw new Error(`Stripe payments in ${code} are not supported`);
  // toFixed first: 1.005 * 100 is 100.49999999999999 in floating point and would round down a cent
  return ZERO_DECIMAL.has(code) ? Math.round(amount) : Math.round(Number((amount * 100).toFixed(2)));
}

export function fromStripeAmount(stripeAmount: number, currencyCode: string): number {
  const code = currencyCode.toUpperCase();
  return ZERO_DECIMAL.has(code) ? stripeAmount : Math.round(stripeAmount) / 100;
}
