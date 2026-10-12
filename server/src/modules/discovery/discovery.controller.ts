//src/modules/discovery/discovery.controller.ts
import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DiscoveryService } from './discovery.service';
import { NearbyQueryDto } from './dto/nearby-query.dto';

/**
 * DiscoveryController
 * ---------------------
 * यो सम्पूर्ण controller PUBLIC हो — कुनै पनि route मा JWT Guard छैन।
 * किनभने customer ले login नगरी नै नजिकको restaurant र menu हेर्न पाउनुपर्छ,
 * ठीक जसरी Zomato/Uber Eats मा app खोल्ने बित्तिकै menu देखिन्छ।
 */
@ApiTags('Discovery (Public)')
@Controller('api/v1/discovery')
export class DiscoveryController {
  constructor(private readonly discoveryService: DiscoveryService) {}

  @Get('restaurants/nearby')
  findNearby(@Query() query: NearbyQueryDto) {
    return this.discoveryService.findNearby(query);
  }

  @Get('restaurants/:idOrSlug')
  findOne(@Param('idOrSlug') idOrSlug: string) {
    return this.discoveryService.findPublicOne(idOrSlug);
  }

  @Get('restaurants/:id/menu')
  findMenu(@Param('id') id: string, @Query('lang') lang?: string) {
    return this.discoveryService.findPublicMenu(id, lang);
  }

  @Get('restaurants/:restaurantId/menu-items/:menuItemId')
  findMenuItemDetail(@Param('restaurantId') restaurantId: string, @Param('menuItemId') menuItemId: string) {
    return this.discoveryService.findPublicMenuItemDetail(restaurantId, menuItemId);
  }

  @Get('restaurants/:restaurantId/menu/search')
  searchMenu(@Param('restaurantId') restaurantId: string, @Query('q') q: string) {
    return this.discoveryService.searchMenu(restaurantId, q);
  }

  @Get('restaurants/:restaurantId/menu/featured-items')
  getFeaturedItems(@Param('restaurantId') restaurantId: string) {
    return this.discoveryService.getFeaturedItems(restaurantId);
  }

  @Get('restaurants/:restaurantId/menu/featured-categories')
  getFeaturedCategories(@Param('restaurantId') restaurantId: string) {
    return this.discoveryService.getFeaturedCategories(restaurantId);
  }

  /** GAP FIX — Frontend ले "यहाँ deliver हुन्छ कि हुँदैन" checkout अघि नै सोध्ने */
  @Get('restaurants/:restaurantId/delivery-check')
  checkDelivery(@Param('restaurantId') restaurantId: string, @Query('lat') lat: string, @Query('lng') lng: string) {
    return this.discoveryService.checkDeliveryAvailability(restaurantId, Number(lat), Number(lng));
  }
}
