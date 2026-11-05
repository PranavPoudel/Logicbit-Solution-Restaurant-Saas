// src/modules/delivery/delivery.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DeliveryService } from './delivery.service';
import { DeliveryPersonManagementController, DeliveryPartnerController, DeliveryAuthController, DeliveryController } from './delivery.controller';
import { DeliveryPartnerService } from './delivery-partner.service';
import { DeliveryJwtStrategy } from './strategies/delivery-jwt.strategy';
import { DeliveryIntegrationService } from './integration/delivery-integration.service';
import { DeliveryWebhookController } from './integration/delivery-webhook.controller';

@Module({
  imports: [
    PassportModule,
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_ACCESS_SECRET'),
        signOptions: { expiresIn: config.get<string>('JWT_ACCESS_EXPIRES_IN') },
      }),
    }),
  ],
  controllers: [DeliveryPersonManagementController, DeliveryPartnerController, DeliveryAuthController, DeliveryController, DeliveryWebhookController],
  providers: [DeliveryService, DeliveryPartnerService, DeliveryJwtStrategy, DeliveryIntegrationService],
  exports: [DeliveryIntegrationService],
})
export class DeliveryModule {}
