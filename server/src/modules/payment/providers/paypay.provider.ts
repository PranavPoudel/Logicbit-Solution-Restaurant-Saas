//src/modules/payment/providers/paypay.provider.ts
import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PaymentProvider, PaymentInitiationResult } from '../payment-provider.interface';
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

  async verifyWebhook(payload: any): Promise<{ orderId: string; success: boolean }> {
    if (payload.notification_type === 'Transaction' && payload.state === 'COMPLETED') {
      return { orderId: payload.merchant_order_id, success: true };
    }
    return { orderId: payload.merchant_order_id, success: false };
  }
}