// modules/menu/category.service.ts
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, restaurantId: string, dto: CreateCategoryDto) {
    const restaurant = await this.prisma.restaurant.findFirst({ where: { id: restaurantId, tenantId } });
    if (!restaurant) throw new NotFoundException('Restaurant not found for this tenant');

    // Only check for duplicates among active (non-deleted) categories
    const existing = await this.prisma.category.findFirst({ 
      where: { tenantId, restaurantId, name: dto.name, deletedAt: null } 
    });
    if (existing) throw new ConflictException(`Category "${dto.name}" already exists in this restaurant`);

    return this.prisma.category.create({ data: { ...dto, tenantId, restaurantId } });
  }

  async findAll(tenantId: string, restaurantId: string, includeDeleted = false) {
    return this.prisma.category.findMany({
      where: {
        tenantId,
        restaurantId,
        deletedAt: includeDeleted ? { not: null } : null,
      },
      include: {
        // Include active menu items so the frontend can display the count (cat.menuItems?.length)
        menuItems: {
          where: { deletedAt: null },
          select: { id: true },
        },
      },
      orderBy: { displayOrder: 'asc' },
    });
  }

  async findOne(tenantId: string, restaurantId: string, id: string) {
    const category = await this.prisma.category.findFirst({ where: { id, tenantId, restaurantId } });
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  async update(tenantId: string, restaurantId: string, id: string, dto: UpdateCategoryDto) {
    await this.findOne(tenantId, restaurantId, id);

    if (dto.name) {
      const duplicate = await this.prisma.category.findFirst({
        where: { tenantId, restaurantId, name: dto.name, NOT: { id }, deletedAt: null },
      });
      if (duplicate) throw new ConflictException(`Category "${dto.name}" already exists in this restaurant`);
    }

    return this.prisma.category.update({ 
      where: { id, tenantId, restaurantId }, 
      data: dto 
    });
  }

  async remove(tenantId: string, restaurantId: string, id: string) {
    await this.findOne(tenantId, restaurantId, id);

    // Soft delete: set deletedAt timestamp instead of permanently deleting
    return this.prisma.category.update({
      where: { id, tenantId, restaurantId },
      data: { deletedAt: new Date() },
    });
  }

  async restore(tenantId: string, restaurantId: string, id: string) {
    // Ensure we only restore items that are actually in the trash
    const category = await this.prisma.category.findFirst({ 
      where: { id, tenantId, restaurantId, deletedAt: { not: null } } 
    });
    if (!category) throw new NotFoundException('Category not found in trash');

    return this.prisma.category.update({
      where: { id, tenantId, restaurantId },
      data: { deletedAt: null },
    });
  }

  async permanentDelete(tenantId: string, restaurantId: string, id: string) {
    // Optional: You could add logic here to delete associated media files from storage
    
    return this.prisma.category.delete({
      where: { id, tenantId, restaurantId },
    });
  }
}