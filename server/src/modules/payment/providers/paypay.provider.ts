//src/modules/payment/providers/paypay.provider.ts
import { Injectable, BadRequestException, BadGatewayException } from '@nestjs/common';
import { PaymentProvider, PaymentInitiationResult, PaymentContext, PaymentCheck, RefundResult } from '../payment-provider.interface';
import { PrismaService } from '../../../prisma/prisma.service';
import { PayPayUtil } from '../../../common/utils/paypay.util';
import { ConfigService } from '@nestjs/config';

/** Sandbox by default; set PAYPAY_BASE_URL=https://apigw.paypay.ne.jp for live payments. */
const SANDBOX_BASE_URL = 'https://apigw.sandbox.paypay.ne.jp';

interface PayPayAccount {
  paypayMerchantId: string;
  paypayApiKey: string;
  paypayApiSecret: string;
}

const hasKeys = (r: { [K in keyof PayPayAccount]?: string | null }): r is PayPayAccount => !!(r.paypayMerchantId && r.paypayApiKey && r.paypayApiSecret);

@Injectable()
export class PayPayProvider implements PaymentProvider {
  readonly methodName = 'PAYPAY';

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async initiate(orderId: string, amount: number, currencyCode: string, context?: PaymentContext): Promise<PaymentInitiationResult> {
    if (!context) throw new BadRequestException('Order details are missing');
    const restaurant = await this.prisma.restaurant.findUnique({ where: { id: context.restaurantId } });
    if (!restaurant) throw new BadRequestException('Restaurant not found');

    if (!hasKeys(restaurant)) throw new BadRequestException('PayPay is not configured for this restaurant.');
    if (currencyCode !== 'JPY' || !Number.isInteger(amount)) {
      throw new BadRequestException('PayPay only takes whole-yen (JPY) payments.');
    }

    const frontendUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:3000';
    const redirectUrl = `${frontendUrl}/payment/callback?orderId=${orderId}&provider=paypay`;

    const payload = PayPayUtil.createPaymentPayload(orderId, amount, currencyCode, `Order ${context.orderNumber}`, redirectUrl);

    try {
      const created = await this.call(restaurant, 'POST', '/v2/codes', payload);
      if (!created.ok || !created.data?.url) throw new Error(created.message);

      return {
        success: true,
        paymentStatus: 'UNPAID',
        redirectUrl: created.data.url,
        providerReference: created.data.merchantPaymentId ?? orderId,
      };
    } catch (error) {
      throw new BadGatewayException(`PayPay could not start the payment: ${error instanceof Error ? error.message : 'unknown error'}`);
    }
  }

  private async call(account: PayPayAccount, method: 'GET' | 'POST', path: string, body?: unknown) {
    const baseUrl = this.configService.get('PAYPAY_BASE_URL') || SANDBOX_BASE_URL;
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        Authorization: PayPayUtil.generateAuthHeader(account.paypayApiKey, account.paypayApiSecret, path, method, body ?? null),
        'Content-Type': PayPayUtil.contentType,
        'X-ASSUME-MERCHANT': account.paypayMerchantId,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const json = await response.json().catch(() => ({}));
    const ok = response.ok && json?.resultInfo?.code === 'SUCCESS';
    return { ok, data: json?.data, message: json?.resultInfo?.message || `HTTP ${response.status} ${response.statusText}` };
  }

  /**
   * Asks PayPay itself whether the order was paid. A webhook only says "check this order": the answer
   * (status, amount, currency) always comes from PayPay, so a forged webhook can never mark anything paid.
   */
  async checkPayment(orderId: string): Promise<PaymentCheck> {
    const order = await this.prisma.order.findUnique({ where: { id: orderId }, include: { restaurant: true } });
    const restaurant = order?.restaurant;
    if (!restaurant || !hasKeys(restaurant)) return { paid: false };
    try {
      const payment = await this.call(restaurant, 'GET', `/v2/codes/payments/${orderId}`);
      if (!payment.ok) return { paid: false };
      return { paid: payment.data?.status === 'COMPLETED', amount: payment.data?.amount?.amount, currency: payment.data?.amount?.currency };
    } catch {
      return { paid: false };
    }
  }

  async refund(orderId: string, amount: number, existingRefundId?: string): Promise<RefundResult> {
    const order = await this.prisma.order.findUnique({ where: { id: orderId }, include: { restaurant: true } });
    if (!order) return { status: 'FAILED', message: 'Order not found' };
    const { restaurant } = order;
    if (!hasKeys(restaurant)) return { status: 'FAILED', message: 'PayPay is not configured for this restaurant.' };
    const state = (status?: string): RefundResult['status'] => (status === 'COMPLETED' ? 'COMPLETED' : status === 'FAILED' ? 'FAILED' : 'PENDING');

    try {
      // A refund PayPay already accepted is checked, not sent twice.
      if (existingRefundId) {
        const known = await this.call(restaurant, 'GET', `/v2/refunds/${existingRefundId}`);
        if (known.ok && known.data?.status !== 'FAILED') {
          return { status: state(known.data?.status), providerReference: existingRefundId };
        }
      }

      const payment = await this.call(restaurant, 'GET', `/v2/codes/payments/${orderId}`);
      if (!payment.ok || !payment.data?.paymentId) return { status: 'FAILED', message: payment.message };
      if (payment.data.status !== 'COMPLETED') return { status: 'FAILED', message: 'PayPay shows this payment as not completed' };

      const payload = PayPayUtil.createRefundPayload(payment.data.paymentId, amount, order.currencyCode ?? restaurant.currencyCode, `Order ${order.orderNumber}`);
      const sent = await this.call(restaurant, 'POST', '/v2/refunds', payload);
      if (!sent.ok) return { status: 'FAILED', message: sent.message, providerReference: payload.merchantRefundId };
      return { status: state(sent.data?.status), providerReference: payload.merchantRefundId, message: sent.data?.status === 'FAILED' ? sent.message : undefined };
    } catch (error) {
      return { status: 'FAILED', message: error instanceof Error ? error.message : 'Could not reach PayPay' };
    }
  }
}
