// modules/menu/menu-item.controller.ts
import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
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
  @ApiOperation({ summary: 'Create a new menu item' })
  create(@Req() req, @Param('restaurantId') restaurantId: string, @Body() dto: CreateMenuItemDto) {
    return this.menuItemService.create(req.user.tenantId, restaurantId, dto);
  }

@Get('duplicates')
  @ApiOperation({ summary: 'Find menu items with duplicate names' })
  findDuplicates(@Req() req, @Param('restaurantId') restaurantId: string) {
    return this.menuItemService.findDuplicates(req.user.tenantId, restaurantId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all menu items for a restaurant, optionally filtered by category or deleted status' })
  findAll(
    @Req() req, 
    @Param('restaurantId') restaurantId: string, 
    @Query('categoryId') categoryId?: string,
    @Query('includeDeleted') includeDeleted?: string | boolean
  ) {
    // Convert string 'true' to boolean if it comes from query params
    const isDeletedIncluded = includeDeleted === 'true' || includeDeleted === true;
    return this.menuItemService.findAll(req.user.tenantId, restaurantId, categoryId, isDeletedIncluded);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single menu item by ID' })
  findOne(@Req() req, @Param('restaurantId') restaurantId: string, @Param('id') id: string) {
    return this.menuItemService.findOne(req.user.tenantId, restaurantId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a menu item' })
  update(@Req() req, @Param('restaurantId') restaurantId: string, @Param('id') id: string, @Body() dto: UpdateMenuItemDto) {
    return this.menuItemService.update(req.user.tenantId, restaurantId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete a menu item (moves to trash)' })
  remove(@Req() req, @Param('restaurantId') restaurantId: string, @Param('id') id: string) {
    return this.menuItemService.remove(req.user.tenantId, restaurantId, id);
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'Restore a soft-deleted menu item from trash' })
  restore(@Req() req, @Param('restaurantId') restaurantId: string, @Param('id') id: string) {
    return this.menuItemService.restore(req.user.tenantId, restaurantId, id);
  }

  @Delete(':id/permanent')
  @ApiOperation({ summary: 'Permanently delete a soft-deleted menu item' })
  permanentDelete(@Req() req, @Param('restaurantId') restaurantId: string, @Param('id') id: string) {
    return this.menuItemService.permanentDelete(req.user.tenantId, restaurantId, id);
  }
}