import { Injectable } from '@nestjs/common';
import { ServiceUnavailableException } from '@nestjs/common';
import { PaymentProvider, PaymentInitiationResult } from '../payment-provider.interface';

/**
 * भविष्यका Payment Gateway हरूको Stub Implementation।
 * -----------------------------------------------------
 * यी providers अहिले काम गर्दैनन् — वास्तविक API key/credential (.env मा)
 * नआएसम्म जानाजान clear error दिन्छन्, silent failure हुँदैन।
 *
 * भविष्यमा activate गर्दा गर्नुपर्ने काम (उदाहरण: eSewa):
 *  1. .env मा ESEWA_MERCHANT_CODE, ESEWA_SECRET_KEY थप्ने
 *  2. यो class भित्र initiate() लाई eSewa को actual API call ले replace गर्ने
 *  3. payment.module.ts मा PAYMENT_PROVIDERS map मा uncomment गर्ने
 * — Order module वा अरू कतै केही बदल्नु पर्दैन, यही file मात्र बदलिन्छ।
 */

@Injectable()
export class CreditCardProvider implements PaymentProvider {
  readonly methodName = 'CREDIT_CARD';
  async initiate(): Promise<PaymentInitiationResult> {
    throw new ServiceUnavailableException(
      'Credit Card payment is not yet configured. Please contact support or choose Cash on Delivery.',
    );
  }
}

@Injectable()
export class EsewaProvider implements PaymentProvider {
  readonly methodName = 'ESEWA';
  async initiate(): Promise<PaymentInitiationResult> {
    throw new ServiceUnavailableException(
      'eSewa payment is not yet configured. Please contact support or choose Cash on Delivery.',
    );
  }
}

@Injectable()
export class KhaltiProvider implements PaymentProvider {
  readonly methodName = 'KHALTI';
  async initiate(): Promise<PaymentInitiationResult> {
    throw new ServiceUnavailableException(
      'Khalti payment is not yet configured. Please contact support or choose Cash on Delivery.',
    );
  }
}

@Injectable()
export class IpsProvider implements PaymentProvider {
  readonly methodName = 'IPS';
  async initiate(): Promise<PaymentInitiationResult> {
    throw new ServiceUnavailableException(
      'IPS payment is not yet configured. Please contact support or choose Cash on Delivery.',
    );
  }
}

@Injectable()
export class PhonePayProvider implements PaymentProvider {
  readonly methodName = 'PHONEPAY';
  async initiate(): Promise<PaymentInitiationResult> {
    throw new ServiceUnavailableException(
      'PhonePay payment is not yet configured. Please contact support or choose Cash on Delivery.',
    );
  }
}
