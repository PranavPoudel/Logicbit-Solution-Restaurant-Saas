// src/modules/payment/payment-provider.interface.ts
export interface PaymentInitiationResult {
  success: boolean;
  paymentStatus: 'UNPAID' | 'PAID' | 'PENDING';
  redirectUrl?: string; // Online gateway भए, customer लाई redirect गर्ने URL
  providerReference?: string; // Gateway को transaction id
}

/** What a provider needs to start a payment for an order that is not saved yet. */
export interface PaymentContext {
  restaurantId: string;
  orderNumber: string;
}

export interface PaymentCheck {
  paid: boolean;
  amount?: number;
  currency?: string;
}

/** Where a customer goes to pay an order that is still unpaid. */
export interface PaymentResume {
  /** True when the money already arrived, so there is nothing left to pay. */
  paid?: boolean;
  redirectUrl?: string;
  /** The gateway's id of the payment page to use from now on. Differs from the old one when the old page expired. */
  providerReference?: string;
}

export interface RefundResult {
  status: 'COMPLETED' | 'PENDING' | 'FAILED';
  providerReference?: string; // Gateway को refund id
  message?: string;
}

/**
 * PaymentProvider — सबै payment method ले implement गर्नुपर्ने common contract।
 * यसले "Strategy Pattern" प्रयोग गर्छ — Order module ले कहिल्यै कुन gateway
 * हो भनेर if/else लेख्दैन, बरु PaymentService ले सही provider छानेर
 * यही interface मार्फत call गर्छ। नयाँ gateway थप्दा यो interface implement
 * गरेको नयाँ class थप्ने मात्र हो, existing code टच गर्नु पर्दैन।
 */
export interface PaymentProvider {
  readonly methodName: string;
  initiate(orderId: string, amount: number, currencyCode: string, context?: PaymentContext): Promise<PaymentInitiationResult>;
  /** Asks the gateway itself whether the order was paid; webhooks only say "check this order". */
  checkPayment?(orderId: string): Promise<PaymentCheck>;
  /** Gives a customer a page to pay an order that is still unpaid: the open one, or a fresh one if it expired. */
  resume?(orderId: string): Promise<PaymentResume>;
  /** Closes the open payment page so a cancelled order cannot be paid afterwards. Reports paid=true when the money already arrived. Throws if it cannot be sure the page is closed. */
  cancelPayment?(orderId: string): Promise<{ paid: boolean }>;
  /** Never throws for a gateway error — it returns FAILED with the gateway's message so the owner can retry. */
  refund?(orderId: string, amount: number, existingRefundId?: string): Promise<RefundResult>;
}
