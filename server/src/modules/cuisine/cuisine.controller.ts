import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SubscriptionActiveGuard } from '../subscription/guards/subscription-active.guard';
import { PlatformStaffJwtAuthGuard } from '../platform-auth/guards/platform-staff-jwt-auth.guard';
import { PlatformPermissionGuard } from '../platform-auth/guards/platform-permission.guard';
import { RequirePlatformPermission } from '../platform-auth/decorators/require-permission.decorator';
import { CuisineService } from './cuisine.service';
import { CreateCuisineDto, UpdateCuisineDto, SetRestaurantCuisinesDto } from './dto/cuisine.dto';

@ApiTags('Cuisine - Public')
@Controller('api/v1/discovery/cuisines')
export class PublicCuisineController {
  constructor(private readonly cuisineService: CuisineService) {}

  @Get()
  findAll() {
    return this.cuisineService.findAllActive();
  }
}

@ApiTags('Cuisine - Platform Admin')
@ApiBearerAuth()
@UseGuards(PlatformStaffJwtAuthGuard, PlatformPermissionGuard)
@Controller('api/v1/platform-admin/cuisines')
export class PlatformCuisineController {
  constructor(private readonly cuisineService: CuisineService) {}
  @Get()
  @RequirePlatformPermission('MANAGE_CUISINES')
  findAll() {
    return this.cuisineService.findAllActive(); 
  }
  @Post()
  @RequirePlatformPermission('MANAGE_CUISINES')
  create(@Body() dto: CreateCuisineDto) {
    return this.cuisineService.create(dto);
  }

  @Patch(':id')
  @RequirePlatformPermission('MANAGE_CUISINES')
  update(@Param('id') id: string, @Body() dto: UpdateCuisineDto) {
    return this.cuisineService.update(id, dto);
  }

  @Delete(':id')
  @RequirePlatformPermission('MANAGE_CUISINES')
  remove(@Param('id') id: string) {
    return this.cuisineService.remove(id);
  }
}

@ApiTags('Cuisine - Owner')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, SubscriptionActiveGuard)
@Controller('api/v1/restaurants/:restaurantId/cuisines')
export class RestaurantCuisineController {
  constructor(private readonly cuisineService: CuisineService) {}

  @Get()
  findMyCuisines(@Param('restaurantId') restaurantId: string) {
    return this.cuisineService.getRestaurantCuisines(restaurantId);
  }

  /** Owner ले managed list बाट (checklist/multi-select UI मार्फत) आफ्नो restaurant को cuisine छान्ने */
  @Patch()
  setCuisines(@Req() req, @Param('restaurantId') restaurantId: string, @Body() dto: SetRestaurantCuisinesDto) {
    return this.cuisineService.setRestaurantCuisines(req.user.tenantId, restaurantId, dto.cuisineIds);
  }
}
