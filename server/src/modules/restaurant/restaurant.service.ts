//src/modules/restaurant/restaurant.service.ts
import { Prisma } from '@prisma/client';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { isValidTimeZone } from '../../common/utils/opening-hours.util';

@Injectable()
export class RestaurantService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string) {
    const restaurants = await this.prisma.restaurant.findMany({ where: { tenantId } });
    
    // Strip the secret from the response using destructuring
    return restaurants.map(({ paypayApiSecret, ...safeData }) => safeData);
  }

  async findOne(tenantId: string, id: string) {
    const restaurant = await this.prisma.restaurant.findFirst({ where: { id, tenantId } });
    if (!restaurant) throw new NotFoundException('Restaurant not found');
    
    // Strip the secret from the response
    const { paypayApiSecret, ...safeRestaurant } = restaurant;
    return safeRestaurant;
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

    if (dto.timezone && !isValidTimeZone(dto.timezone)) throw new BadRequestException('Unknown timezone');
    
    const { openingHours, ...rest } = dto;
    await this.prisma.restaurant.updateMany({ 
      where: { id, tenantId }, 
      data: { ...rest, ...(openingHours && { openingHours: openingHours as unknown as Prisma.InputJsonValue }) },
    });
    
    return this.findOne(tenantId, id);
  }
}