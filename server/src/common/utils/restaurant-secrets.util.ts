/**
 * A restaurant row holds payment secrets. Anything sent to a browser (owner or platform admin) goes through this,
 * so the secrets are removed and only "is a Stripe key saved" is reported.
 */
export function withoutPaymentSecrets<T extends { paypayApiSecret?: unknown; stripeSecretKey?: unknown }>(restaurant: T) {
  const { paypayApiSecret: _paypayApiSecret, stripeSecretKey, ...safe } = restaurant;
  return { ...safe, hasStripeKey: !!stripeSecretKey } as Omit<T, 'paypayApiSecret' | 'stripeSecretKey'> & { hasStripeKey: boolean };
}
