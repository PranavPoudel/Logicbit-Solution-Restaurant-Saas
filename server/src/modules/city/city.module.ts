import { Module } from '@nestjs/common';
import { CityService } from './city.service';
import { PlatformCityController, PublicCityController } from './city.controller';

@Module({
  controllers: [PublicCityController, PlatformCityController],
  providers: [CityService],
  exports: [CityService],
})
export class CityModule {}
