// modules/menu/category.controller.ts
import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AllowWithoutPlan, SubscriptionActiveGuard } from '../subscription/guards/subscription-active.guard';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@ApiTags('Menu - Category')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, SubscriptionActiveGuard)
@AllowWithoutPlan()
@Controller('api/v1/restaurants/:restaurantId/categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new category' })
  create(@Req() req, @Param('restaurantId') restaurantId: string, @Body() dto: CreateCategoryDto) {
    return this.categoryService.create(req.user.tenantId, restaurantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all categories, optionally including soft-deleted ones (for Trash)' })
  findAll(
    @Req() req,
    @Param('restaurantId') restaurantId: string,
    @Query('includeDeleted') includeDeleted?: string | boolean
  ) {
    const isDeletedIncluded = includeDeleted === 'true' || includeDeleted === true;
    return this.categoryService.findAll(req.user.tenantId, restaurantId, isDeletedIncluded);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single category by ID' })
  findOne(@Req() req, @Param('restaurantId') restaurantId: string, @Param('id') id: string) {
    return this.categoryService.findOne(req.user.tenantId, restaurantId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a category' })
  update(@Req() req, @Param('restaurantId') restaurantId: string, @Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.categoryService.update(req.user.tenantId, restaurantId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete a category (moves to trash)' })
  remove(@Req() req, @Param('restaurantId') restaurantId: string, @Param('id') id: string) {
    return this.categoryService.remove(req.user.tenantId, restaurantId, id);
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'Restore a soft-deleted category from trash' })
  restore(@Req() req, @Param('restaurantId') restaurantId: string, @Param('id') id: string) {
    return this.categoryService.restore(req.user.tenantId, restaurantId, id);
  }

  @Delete(':id/permanent')
  @ApiOperation({ summary: 'Permanently delete a soft-deleted category' })
  permanentDelete(@Req() req, @Param('restaurantId') restaurantId: string, @Param('id') id: string) {
    return this.categoryService.permanentDelete(req.user.tenantId, restaurantId, id);
  }
}