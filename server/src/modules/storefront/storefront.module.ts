import { Module } from '@nestjs/common';
import { StorefrontService } from './storefront.service';
import { StorefrontController, PublicStorefrontController } from './storefront.controller';

@Module({
  controllers: [StorefrontController, PublicStorefrontController],
  providers: [StorefrontService],
})
export class StorefrontModule {}
