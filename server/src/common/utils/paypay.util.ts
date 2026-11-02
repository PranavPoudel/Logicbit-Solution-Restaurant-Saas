//src/common/utils/paypay.util.ts
import * as crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

export class PayPayUtil {
  /**
   * Generates the required 'Authorization' header for PayPay Open API.
   * PayPay uses a specific HMAC-SHA256 signature algorithm.
   */
  static generateAuthHeader(
    apiSecret: string,
    url: string, // e.g., '/v2/codes/dynamic'
    method: string, // 'POST' or 'GET'
    body: any = null,
  ): string {
    const epoch = Math.floor(Date.now() / 1000).toString();
    const nonce = uuidv4();
    
    // PayPay requires the body to be a JSON string for the signature
    const bodyString = body ? JSON.stringify(body) : '';
    
    // The message must be joined by newline characters exactly in this order
    const message = [url, method, nonce, epoch, bodyString].join('\n');
    
    const hash = crypto
      .createHmac('SHA256', apiSecret)
      .update(message)
      .digest('base64');
      
    // PayPay requires the 'hmac OPA-Auth:' prefix
    return `hmac OPA-Auth:${hash}`;
  }

  /**
   * Constructs the payload for creating a Dynamic QR/Payment Link.
   */
  static createPaymentPayload(
    orderId: string,
    amount: number,
    currencyCode: string,
    orderDescription: string,
    redirectUrl: string,
  ) {
    return {
      merchantPaymentId: orderId, // This is how we map the webhook back to our Order
      amount: {
        amount: amount,
        currency: currencyCode,
      },
      orderDetails: [
        {
          name: orderDescription,
          category: 'Food & Beverage',
          quantity: 1,
          productId: 'ORDER_TOTAL',
          unitPrice: {
            amount: amount,
            currency: currencyCode,
          },
        },
      ],
      requestedAt: Math.floor(Date.now() / 1000),
      redirectUrl: redirectUrl,
      redirectType: 'WEB_LINK', // 'WEB_LINK' or 'APP_DEEP_LINK'
      isAuthorization: false,
      authorizationExpiry: null,
    };
  }
  static createRefundPayload(paymentId: string, amount: number, currencyCode: string, reason: string) {
    return {
      merchantRefundId: uuidv4(),
      paymentId, // PayPay's own id for the payment, not our merchantPaymentId
      amount: { amount, currency: currencyCode },
      requestedAt: Math.floor(Date.now() / 1000),
      reason,
    };
  }

  static verifyWebhookSignature(
    apiSecret: string,
    headers: any,
    rawBody: string,
    url: string,
    method: string,
  ): boolean {
    const authHeader = headers['authorization'] || headers['Authorization'];
    if (!authHeader || !authHeader.startsWith('hmac OPA-Auth:')) {
      return false;
    }

    const providedSignature = authHeader.replace('hmac OPA-Auth:', '');
    const nonce = headers['x-nonce'] || headers['X-Nonce'];
    const epoch = headers['x-epoch'] || headers['X-Epoch'];

    if (!nonce || !epoch) {
      return false;
    }

    const message = [url, method, nonce, epoch, rawBody].join('\n');
    const expectedSignature = crypto
      .createHmac('SHA256', apiSecret)
      .update(message)
      .digest('base64');

    // Use timingSafeEqual to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(providedSignature),
    );
  }
}