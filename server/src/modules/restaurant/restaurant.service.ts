import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';

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

  async update(tenantId: string, id: string, dto: UpdateRestaurantDto) {
    await this.findOne(tenantId, id);
    await this.prisma.restaurant.updateMany({ where: { id, tenantId }, data: dto });
    return this.findOne(tenantId, id);
  }
}
