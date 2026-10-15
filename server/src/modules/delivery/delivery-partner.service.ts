// src/modules/delivery/delivery-partner.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDeliveryPartnerDto, UpdateDeliveryPartnerDto } from './dto/delivery-partner.dto';

@Injectable()
export class DeliveryPartnerService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertRestaurant(tenantId: string, restaurantId: string) {
    const restaurant = await this.prisma.restaurant.findFirst({ where: { id: restaurantId, tenantId } });
    if (!restaurant) throw new NotFoundException('Restaurant not found for this tenant');
  }

  private assertFee(feeType?: string, feeValue?: number) {
    if (feeType === 'PERCENT' && feeValue !== undefined && feeValue > 100) {
      throw new BadRequestException('A percentage fee cannot be more than 100');
    }
  }

  async findAll(tenantId: string, restaurantId: string) {
    await this.assertRestaurant(tenantId, restaurantId);
    return this.prisma.deliveryPartner.findMany({
      where: { tenantId, restaurantId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(tenantId: string, restaurantId: string, dto: CreateDeliveryPartnerDto) {
    await this.assertRestaurant(tenantId, restaurantId);
    this.assertFee(dto.feeType ?? 'PERCENT', dto.feeValue);
    return this.prisma.deliveryPartner.create({ data: { ...dto, tenantId, restaurantId } });
  }

  private async findOwned(tenantId: string, restaurantId: string, id: string) {
    const partner = await this.prisma.deliveryPartner.findFirst({ where: { id, tenantId, restaurantId, deletedAt: null } });
    if (!partner) throw new NotFoundException('Delivery partner not found');
    return partner;
  }

  async update(tenantId: string, restaurantId: string, id: string, dto: UpdateDeliveryPartnerDto) {
    const partner = await this.findOwned(tenantId, restaurantId, id);
    this.assertFee(dto.feeType ?? partner.feeType, dto.feeValue ?? partner.feeValue);
    return this.prisma.deliveryPartner.update({ where: { id }, data: dto });
  }

  async remove(tenantId: string, restaurantId: string, id: string) {
    await this.findOwned(tenantId, restaurantId, id);
    await this.prisma.deliveryPartner.update({ where: { id }, data: { deletedAt: new Date() } });
    return { success: true };
  }
}
