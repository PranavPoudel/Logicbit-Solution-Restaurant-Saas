// src/modules/menu/menu-item.service.ts
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';

@Injectable()
export class MenuItemService {
  constructor(private readonly prisma: PrismaService) {}

  private async validateCategory(tenantId: string, restaurantId: string, categoryId: string) {
    const category = await this.prisma.category.findFirst({ where: { id: categoryId, tenantId, restaurantId } });
    if (!category) throw new NotFoundException('Category not found for this restaurant');
    return category;
  }

  async create(tenantId: string, restaurantId: string, dto: CreateMenuItemDto) {
    await this.validateCategory(tenantId, restaurantId, dto.categoryId);

    const existing = await this.prisma.menuItem.findFirst({
      where: { tenantId, restaurantId, name: dto.name, deletedAt: null },
    });
    if (existing) throw new ConflictException(`Menu item "${dto.name}" already exists in this restaurant`);

    return this.prisma.menuItem.create({ data: { ...dto, tenantId, restaurantId } });
  }

async findAll(tenantId: string, restaurantId: string, categoryId?: string, includeDeleted = false) {
  return this.prisma.menuItem.findMany({
    where: {
      tenantId,
      restaurantId,
      categoryId: categoryId || undefined,
      deletedAt: includeDeleted ? { not: null } : null, // Filters out soft-deleted unless requested
    },
    include: { category: true }, // or whatever relations you currently have
    orderBy: { displayOrder: 'asc' },
  });
}

  async findOne(tenantId: string, restaurantId: string, id: string) {
    const item = await this.prisma.menuItem.findFirst({
      where: { id, tenantId, restaurantId, deletedAt: null },
      include: { category: { select: { id: true, name: true } } },
    });
    if (!item) throw new NotFoundException('Menu item not found');
    return item;
  }

  async update(tenantId: string, restaurantId: string, id: string, dto: UpdateMenuItemDto) {
    await this.findOne(tenantId, restaurantId, id);

    if (dto.categoryId) {
      await this.validateCategory(tenantId, restaurantId, dto.categoryId);
    }

    if (dto.name) {
      const duplicate = await this.prisma.menuItem.findFirst({
        where: { tenantId, restaurantId, name: dto.name, deletedAt: null, NOT: { id } },
      });
      if (duplicate) throw new ConflictException(`Menu item "${dto.name}" already exists in this restaurant`);
    }

    await this.prisma.menuItem.updateMany({ where: { id, tenantId, restaurantId }, data: dto });
    return this.findOne(tenantId, restaurantId, id);
  }

  /** Soft delete — order history integrity को लागि row मेटिँदैन */
 async remove(tenantId: string, restaurantId: string, id: string) {
  return this.prisma.menuItem.update({
    where: { id, tenantId, restaurantId },
    data: { deletedAt: new Date() },
  });
}
async restore(tenantId: string, restaurantId: string, id: string) {
  return this.prisma.menuItem.update({
    where: { id, tenantId, restaurantId, deletedAt: { not: null } },
    data: { deletedAt: null },
  });
}

async permanentDelete(tenantId: string, restaurantId: string, id: string) {
  return this.prisma.menuItem.delete({
    where: { id, tenantId, restaurantId },
  });
}

  async findDuplicates(tenantId: string, restaurantId: string) {
    // 1. Fetch all active (non-deleted) menu items for this restaurant
    const items = await this.prisma.menuItem.findMany({
      where: { tenantId, restaurantId, deletedAt: null },
      select: { 
        id: true, 
        name: true, 
        price: true, 
        image: true, 
        createdAt: true, 
        category: { select: { name: true } } 
      },
    });

    // 2. Group them by name (case-insensitive)
    const grouped = items.reduce((acc, item) => {
      const key = item.name.trim().toLowerCase();
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {} as Record<string, typeof items>);

    // 3. Return only the groups that have more than 1 item (the actual duplicates)
    return Object.values(grouped).filter((group) => group.length > 1);
  }
}
