//src/modules/payment/providers/paypay.provider.ts
import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PaymentProvider, PaymentInitiationResult, RefundResult } from '../payment-provider.interface';
import { PrismaService } from '../../../prisma/prisma.service';
import { PayPayUtil } from '../../../common/utils/paypay.util';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PayPayProvider implements PaymentProvider {
  readonly methodName = 'PAYPAY';

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async initiate(orderId: string, amount: number, currencyCode: string): Promise<PaymentInitiationResult> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { restaurant: true },
    });

    if (!order) throw new BadRequestException('Order not found');
    const { restaurant } = order;

    if (!restaurant.paypayMerchantId || !restaurant.paypayApiKey || !restaurant.paypayApiSecret) {
      throw new BadRequestException('PayPay is not configured for this restaurant.');
    }

    const frontendUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:3000';
    const redirectUrl = `${frontendUrl}/payment/callback?orderId=${orderId}&provider=paypay`;

    const path = '/v2/codes/dynamic';
    const method = 'POST';
    
    const payload = PayPayUtil.createPaymentPayload(
      orderId,
      amount,
      currencyCode,
      `Order ${order.orderNumber}`,
      redirectUrl,
    );

    const authHeader = PayPayUtil.generateAuthHeader(
      restaurant.paypayApiSecret,
      path,
      method,
      payload,
    );

    const baseUrl = this.configService.get('PAYPAY_BASE_URL') || 'https://stg-api.sandbox.paypay.ne.jp';
    
    try {
      // ✅ Uses Node.js native fetch (No axios needed!)
      const response = await fetch(`${baseUrl}${path}`, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
          'X-ASSUME-MERCHANT': restaurant.paypayMerchantId,
        },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json();

      if (!response.ok || responseData?.resultInfo?.code !== 'SUCCESS') {
        const errorMsg = responseData?.resultInfo?.message || `HTTP ${response.status} ${response.statusText}`;
        throw new Error(errorMsg);
      }

      return {
        success: true,
        paymentStatus: 'UNPAID',
        redirectUrl: responseData.data.url, 
        providerReference: responseData.data.merchantPaymentId,
      };
    } catch (error) {
      // ✅ Safe error handling without Axios types
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new InternalServerErrorException(`PayPay integration error: ${errorMessage}`);
    }
  }

  private async call(restaurant: { paypayMerchantId: string; paypayApiSecret: string }, method: 'GET' | 'POST', path: string, body?: unknown) {
    const baseUrl = this.configService.get('PAYPAY_BASE_URL') || 'https://stg-api.sandbox.paypay.ne.jp';
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        Authorization: PayPayUtil.generateAuthHeader(restaurant.paypayApiSecret, path, method, body ?? null),
        'Content-Type': 'application/json',
        'X-ASSUME-MERCHANT': restaurant.paypayMerchantId,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const json = await response.json().catch(() => ({}));
    const ok = response.ok && json?.resultInfo?.code === 'SUCCESS';
    return { ok, data: json?.data, message: json?.resultInfo?.message || `HTTP ${response.status} ${response.statusText}` };
  }

  async refund(orderId: string, amount: number, existingRefundId?: string): Promise<RefundResult> {
    const order = await this.prisma.order.findUnique({ where: { id: orderId }, include: { restaurant: true } });
    if (!order) return { status: 'FAILED', message: 'Order not found' };
    const { restaurant } = order;
    if (!restaurant.paypayMerchantId || !restaurant.paypayApiSecret) {
      return { status: 'FAILED', message: 'PayPay is not configured for this restaurant.' };
    }
    const account = { paypayMerchantId: restaurant.paypayMerchantId, paypayApiSecret: restaurant.paypayApiSecret };
    const state = (status?: string): RefundResult['status'] => (status === 'COMPLETED' ? 'COMPLETED' : status === 'FAILED' ? 'FAILED' : 'PENDING');

    try {
      // A refund PayPay already accepted is checked, not sent twice.
      if (existingRefundId) {
        const known = await this.call(account, 'GET', `/v2/refunds/${existingRefundId}`);
        if (known.ok && known.data?.status !== 'FAILED') {
          return { status: state(known.data?.status), providerReference: existingRefundId };
        }
      }

      const payment = await this.call(account, 'GET', `/v2/payments/${orderId}`);
      if (!payment.ok || !payment.data?.paymentId) return { status: 'FAILED', message: payment.message };
      if (payment.data.status !== 'COMPLETED') return { status: 'FAILED', message: 'PayPay shows this payment as not completed' };

      const payload = PayPayUtil.createRefundPayload(payment.data.paymentId, amount, order.currencyCode ?? restaurant.currencyCode, `Order ${order.orderNumber}`);
      const sent = await this.call(account, 'POST', '/v2/refunds', payload);
      if (!sent.ok) return { status: 'FAILED', message: sent.message, providerReference: payload.merchantRefundId };
      return { status: state(sent.data?.status), providerReference: payload.merchantRefundId, message: sent.data?.status === 'FAILED' ? sent.message : undefined };
    } catch (error) {
      return { status: 'FAILED', message: error instanceof Error ? error.message : 'Could not reach PayPay' };
    }
  }

  async verifyWebhook(payload: any): Promise<{ orderId: string; success: boolean }> {
    if (payload.notification_type === 'Transaction' && payload.state === 'COMPLETED') {
      return { orderId: payload.merchant_order_id, success: true };
    }
    return { orderId: payload.merchant_order_id, success: false };
  }
}