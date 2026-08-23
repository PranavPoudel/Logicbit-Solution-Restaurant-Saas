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

    const existing = await this.prisma.category.findFirst({ where: { tenantId, restaurantId, name: dto.name } });
    if (existing) throw new ConflictException(`Category "${dto.name}" already exists in this restaurant`);

    return this.prisma.category.create({ data: { ...dto, tenantId, restaurantId } });
  }

  async findAll(tenantId: string, restaurantId: string) {
    return this.prisma.category.findMany({
      where: { tenantId, restaurantId },
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
        where: { tenantId, restaurantId, name: dto.name, NOT: { id } },
      });
      if (duplicate) throw new ConflictException(`Category "${dto.name}" already exists in this restaurant`);
    }

    await this.prisma.category.updateMany({ where: { id, tenantId, restaurantId }, data: dto });
    return this.findOne(tenantId, restaurantId, id);
  }

  async remove(tenantId: string, restaurantId: string, id: string) {
    await this.findOne(tenantId, restaurantId, id);

    const linkedItems = await this.prisma.menuItem.count({ where: { categoryId: id, tenantId, restaurantId, deletedAt: null } });
    if (linkedItems > 0) {
      throw new ConflictException(`Cannot delete: ${linkedItems} menu item(s) still linked to this category`);
    }

    await this.prisma.category.deleteMany({ where: { id, tenantId, restaurantId } });
    return { message: 'Category deleted successfully' };
  }
}
