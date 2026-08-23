import { Module } from '@nestjs/common';
import { AdvertisementService } from './advertisement.service';
import { AdvertisementController, PlatformAdvertisementController, PublicAdvertisementController } from './advertisement.controller';

@Module({
  controllers: [AdvertisementController, PlatformAdvertisementController, PublicAdvertisementController],
  providers: [AdvertisementService],
  exports: [AdvertisementService],
})
export class AdvertisementModule {}
