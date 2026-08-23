import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@ApiTags('Menu - Category')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/restaurants/:restaurantId/categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  create(@Req() req, @Param('restaurantId') restaurantId: string, @Body() dto: CreateCategoryDto) {
    return this.categoryService.create(req.user.tenantId, restaurantId, dto);
  }

  @Get()
  findAll(@Req() req, @Param('restaurantId') restaurantId: string) {
    return this.categoryService.findAll(req.user.tenantId, restaurantId);
  }

  @Get(':id')
  findOne(@Req() req, @Param('restaurantId') restaurantId: string, @Param('id') id: string) {
    return this.categoryService.findOne(req.user.tenantId, restaurantId, id);
  }

  @Patch(':id')
  update(@Req() req, @Param('restaurantId') restaurantId: string, @Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.categoryService.update(req.user.tenantId, restaurantId, id, dto);
  }

  @Delete(':id')
  remove(@Req() req, @Param('restaurantId') restaurantId: string, @Param('id') id: string) {
    return this.categoryService.remove(req.user.tenantId, restaurantId, id);
  }
}
