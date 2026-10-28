export interface CheckoutResult {
  redirectUrl: string;
  providerReference: string;
}

export interface WebhookResult {
  paymentId: string;
  success: boolean;
}

export interface SubscriptionPaymentProvider {
  readonly methodName: 'PAYPAY' | 'CARD';
  createCheckout(input: { paymentId: string; amount: number; currencyCode: string; planName: string }): Promise<CheckoutResult>;
  verifyWebhook(payload: any, signature?: string): Promise<WebhookResult>;
}
