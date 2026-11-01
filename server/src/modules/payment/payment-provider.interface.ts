// src/modules/payment/payment-provider.interface.ts
export interface PaymentInitiationResult {
  success: boolean;
  paymentStatus: 'UNPAID' | 'PAID' | 'PENDING';
  redirectUrl?: string; // Online gateway भए, customer लाई redirect गर्ने URL
  providerReference?: string; // Gateway को transaction id
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
  initiate(orderId: string, amount: number, currencyCode: string): Promise<PaymentInitiationResult>;
  verifyWebhook?(payload: any, signature?: string): Promise<{ orderId: string; success: boolean }>;
  /** Never throws for a gateway error — it returns FAILED with the gateway's message so the owner can retry. */
  refund?(orderId: string, amount: number, existingRefundId?: string): Promise<RefundResult>;
}
