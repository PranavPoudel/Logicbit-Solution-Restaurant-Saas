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

  async findAll(tenantId: string, restaurantId: string, categoryId?: string) {
    return this.prisma.menuItem.findMany({
      where: { tenantId, restaurantId, deletedAt: null, ...(categoryId ? { categoryId } : {}) },
      orderBy: { displayOrder: 'asc' },
      include: { category: { select: { id: true, name: true } } },
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
    await this.findOne(tenantId, restaurantId, id);
    await this.prisma.menuItem.updateMany({ where: { id, tenantId, restaurantId }, data: { deletedAt: new Date() } });
    return { message: 'Menu item deleted successfully' };
  }
}
