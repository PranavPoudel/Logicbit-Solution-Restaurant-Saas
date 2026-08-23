import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MenuItemService } from './menu-item.service';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';

@ApiTags('Menu - MenuItem')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/restaurants/:restaurantId/menu-items')
export class MenuItemController {
  constructor(private readonly menuItemService: MenuItemService) {}

  @Post()
  create(@Req() req, @Param('restaurantId') restaurantId: string, @Body() dto: CreateMenuItemDto) {
    return this.menuItemService.create(req.user.tenantId, restaurantId, dto);
  }

  @Get()
  findAll(@Req() req, @Param('restaurantId') restaurantId: string, @Query('categoryId') categoryId?: string) {
    return this.menuItemService.findAll(req.user.tenantId, restaurantId, categoryId);
  }

  @Get(':id')
  findOne(@Req() req, @Param('restaurantId') restaurantId: string, @Param('id') id: string) {
    return this.menuItemService.findOne(req.user.tenantId, restaurantId, id);
  }

  @Patch(':id')
  update(@Req() req, @Param('restaurantId') restaurantId: string, @Param('id') id: string, @Body() dto: UpdateMenuItemDto) {
    return this.menuItemService.update(req.user.tenantId, restaurantId, id, dto);
  }

  @Delete(':id')
  remove(@Req() req, @Param('restaurantId') restaurantId: string, @Param('id') id: string) {
    return this.menuItemService.remove(req.user.tenantId, restaurantId, id);
  }
}
