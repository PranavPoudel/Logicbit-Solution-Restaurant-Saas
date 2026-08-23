import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCuisineDto, UpdateCuisineDto } from './dto/cuisine.dto';

@Injectable()
export class CuisineService {
  constructor(private readonly prisma: PrismaService) {}

  // ---------- Platform Admin: Master List Management ----------

  async create(dto: CreateCuisineDto) {
    const slug = this.slugify(dto.name);
    const existing = await this.prisma.cuisine.findFirst({ where: { OR: [{ name: dto.name }, { slug }] } });
    if (existing) throw new ConflictException(`Cuisine "${dto.name}" already exists`);

    return this.prisma.cuisine.create({ data: { name: dto.name, slug, iconUrl: dto.iconUrl } });
  }

  async update(id: string, dto: UpdateCuisineDto) {
    const cuisine = await this.prisma.cuisine.findUnique({ where: { id } });
    if (!cuisine) throw new NotFoundException('Cuisine not found');

    return this.prisma.cuisine.update({
      where: { id },
      data: { ...dto, slug: dto.name ? this.slugify(dto.name) : undefined },
    });
  }

  async remove(id: string) {
    // Hard delete होइन — कतै प्रयोग भइरहेको हुन सक्छ, deactivate मात्र
    await this.prisma.cuisine.update({ where: { id }, data: { isActive: false } });
    return { message: 'Cuisine deactivated' };
  }

  // ---------- Public: List for filter dropdown/checklist ----------

  async findAllActive() {
    return this.prisma.cuisine.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } });
  }

  // ---------- Owner: Set restaurant's cuisines (managed list बाट select गर्ने) ----------

  async setRestaurantCuisines(tenantId: string, restaurantId: string, cuisineIds: string[]) {
    const restaurant = await this.prisma.restaurant.findFirst({ where: { id: restaurantId, tenantId } });
    if (!restaurant) throw new NotFoundException('Restaurant not found');

    const validCuisines = await this.prisma.cuisine.findMany({ where: { id: { in: cuisineIds }, isActive: true } });
    if (validCuisines.length !== cuisineIds.length) {
      throw new NotFoundException('One or more selected cuisines do not exist or are inactive');
    }

    await this.prisma.$transaction([
      this.prisma.restaurantCuisine.deleteMany({ where: { restaurantId } }),
      this.prisma.restaurantCuisine.createMany({ data: cuisineIds.map((cuisineId) => ({ restaurantId, cuisineId })) }),
    ]);

    return this.getRestaurantCuisines(restaurantId);
  }

  async getRestaurantCuisines(restaurantId: string) {
    const links = await this.prisma.restaurantCuisine.findMany({ where: { restaurantId }, include: { cuisine: true } });
    return links.map((l) => l.cuisine);
  }

  private slugify(text: string): string {
    return text.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }
}
