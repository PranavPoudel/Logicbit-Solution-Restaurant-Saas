import { Module } from '@nestjs/common';
import { CuisineService } from './cuisine.service';
import { PublicCuisineController, PlatformCuisineController, RestaurantCuisineController } from './cuisine.controller';

@Module({
  controllers: [PublicCuisineController, PlatformCuisineController, RestaurantCuisineController],
  providers: [CuisineService],
  exports: [CuisineService],
})
export class CuisineModule {}
