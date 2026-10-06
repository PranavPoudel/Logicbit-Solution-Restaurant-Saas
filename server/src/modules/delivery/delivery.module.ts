// src/modules/delivery/delivery.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DeliveryService } from './delivery.service';
import { DeliveryPersonManagementController, DeliveryAuthController, DeliveryController } from './delivery.controller';
import { DeliveryJwtStrategy } from './strategies/delivery-jwt.strategy';

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
  controllers: [DeliveryPersonManagementController, DeliveryAuthController, DeliveryController],
  providers: [DeliveryService, DeliveryJwtStrategy],
})
export class DeliveryModule {}
