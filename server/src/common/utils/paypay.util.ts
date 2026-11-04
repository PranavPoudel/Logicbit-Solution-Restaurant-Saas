//src/common/utils/paypay.util.ts
import * as crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

export class PayPayUtil {
  static readonly contentType = 'application/json;charset=UTF-8';

  /**
   * Builds the 'Authorization' header PayPay Open Payment API expects:
   * hmac OPA-Auth:<apiKey>:<signature>:<nonce>:<epoch>:<bodyHash>
   * A request without a body signs the literal string "empty" for both the content type and the body hash.
   */
  static generateAuthHeader(
    apiKey: string,
    apiSecret: string,
    path: string, // e.g. '/v2/codes'
    method: string, // 'POST' or 'GET'
    body: unknown = null,
  ): string {
    const epoch = Math.floor(Date.now() / 1000).toString();
    const nonce = uuidv4().slice(0, 8);

    let contentType = 'empty';
    let bodyHash = 'empty';
    if (body) {
      contentType = PayPayUtil.contentType;
      bodyHash = crypto.createHash('md5').update(contentType).update(JSON.stringify(body)).digest('base64');
    }

    const message = [path, method, nonce, epoch, contentType, bodyHash].join('\n');
    const signature = crypto.createHmac('sha256', apiSecret).update(message).digest('base64');

    return `hmac OPA-Auth:${[apiKey, signature, nonce, epoch, bodyHash].join(':')}`;
  }

  /**
   * Constructs the payload for creating a Dynamic QR/Payment Link.
   * PayPay only accepts whole-yen amounts, so the caller must pass an integer JPY amount.
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
      codeType: 'ORDER_QR',
      amount: {
        amount: amount,
        currency: currencyCode,
      },
      orderDescription,
      orderItems: [
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
}
