import { Controller, Get, Patch, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RestaurantService } from './restaurant.service';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';

@ApiTags('Restaurant (Owner)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/restaurants')
export class RestaurantController {
  constructor(private readonly restaurantService: RestaurantService) {}

  @Get()
  findAll(@Req() req) {
    return this.restaurantService.findAll(req.user.tenantId);
  }

  @Get(':id')
  findOne(@Req() req, @Param('id') id: string) {
    return this.restaurantService.findOne(req.user.tenantId, id);
  }

  @Patch(':id')
  update(@Req() req, @Param('id') id: string, @Body() dto: UpdateRestaurantDto) {
    return this.restaurantService.update(req.user.tenantId, id, dto);
  }
}
