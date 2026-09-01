import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';


@Injectable()
export class RestaurantService {
  constructor(private readonly prisma: PrismaService) {}

  /** Logged-in tenant भित्रका सबै restaurant (प्राय: एउटा मात्र हुन्छ, तर multi-branch सम्भव) */
  async findAll(tenantId: string) {
    return this.prisma.restaurant.findMany({ where: { tenantId } });
  }

  async findOne(tenantId: string, id: string) {
    const restaurant = await this.prisma.restaurant.findFirst({ where: { id, tenantId } });
    if (!restaurant) throw new NotFoundException('Restaurant not found');
    return restaurant;
  }
 async create(tenantId: string, dto: CreateRestaurantDto) {
 const restaurant = await this.prisma.restaurant.create({
      data: {
        tenantId,
        name: dto.name,
        slug: dto.slug,
        city: dto.city,
        isOpen: dto.isOpen ?? true,
        supportsDelivery: dto.supportsDelivery ?? true,
        supportsPickup: dto.supportsPickup ?? true,
        supportsDineIn: dto.supportsDineIn ?? false,
        // Defaults for required fields
        selfDeliveryRadiusKm: 5,
        maxDeliveryRadiusKm: 10,
        platformCommissionPercent: 10,
        primaryColor: '#E3A008',
        secondaryColor: '#17181C',
      },
    });

    return restaurant;
  }
  async update(tenantId: string, id: string, dto: UpdateRestaurantDto) {
    await this.findOne(tenantId, id);
    await this.prisma.restaurant.updateMany({ where: { id, tenantId }, data: dto });
    return this.findOne(tenantId, id);
  }
}
