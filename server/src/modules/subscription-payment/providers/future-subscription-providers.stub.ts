import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { CheckoutResult, SubscriptionPaymentProvider, WebhookResult } from '../subscription-payment-provider.interface';

/**
 * Subscription payment gateways that are not connected yet. They fail loudly instead of
 * pretending to charge, and the checkout/webhook flow around them is already in place.
 *
 * To activate one (example: PayPay):
 *  1. Add the platform's own merchant credentials to .env. Subscriptions are paid to the platform,
 *     not to a restaurant, so these are not the per-restaurant keys the order PayPay provider uses.
 *  2. Replace createCheckout() with the real gateway call and return its redirect URL and reference.
 *     Set the gateway's return URL to `${FRONTEND_URL}/owner/subscriptions?paymentId=${paymentId}`: the page
 *     reads that id and waits for the webhook result. Card gateways must run 3-D Secure (required for
 *     online card payments in Japan), which the hosted payment page normally handles.
 *  3. Replace verifyWebhook() with the gateway's signature check, returning the payment id and result.
 * Nothing else changes: PaymentService-style callers only see the SubscriptionPaymentProvider interface.
 */

@Injectable()
export class PayPaySubscriptionProvider implements SubscriptionPaymentProvider {
  readonly methodName = 'PAYPAY' as const;

  async createCheckout(): Promise<CheckoutResult> {
    throw new ServiceUnavailableException('PayPay subscription payments are not configured yet. Please contact support.');
  }

  async verifyWebhook(): Promise<WebhookResult> {
    throw new ServiceUnavailableException('PayPay subscription payments are not configured yet.');
  }
}

@Injectable()
export class CardSubscriptionProvider implements SubscriptionPaymentProvider {
  readonly methodName = 'CARD' as const;

  async createCheckout(): Promise<CheckoutResult> {
    throw new ServiceUnavailableException('Card subscription payments are not configured yet. Please contact support.');
  }

  async verifyWebhook(): Promise<WebhookResult> {
    throw new ServiceUnavailableException('Card subscription payments are not configured yet.');
  }
}
