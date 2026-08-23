import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAddressDto, UpdateAddressDto } from './dto/customer.dto';

@Injectable()
export class CustomerService {
  constructor(private readonly prisma: PrismaService) {}

  // ---------- Saved Addresses ----------

  async addAddress(customerId: string, dto: CreateAddressDto) {
    if (dto.isDefault) {
      await this.prisma.customerAddress.updateMany({ where: { customerId }, data: { isDefault: false } });
    }
    return this.prisma.customerAddress.create({ data: { ...dto, customerId } });
  }

  async findAllAddresses(customerId: string) {
    return this.prisma.customerAddress.findMany({ where: { customerId } });
  }

  async updateAddress(customerId: string, id: string, dto: UpdateAddressDto) {
    const address = await this.prisma.customerAddress.findFirst({ where: { id, customerId } });
    if (!address) throw new NotFoundException('Address not found');

    if (dto.isDefault) {
      await this.prisma.customerAddress.updateMany({ where: { customerId }, data: { isDefault: false } });
    }

    return this.prisma.customerAddress.update({ where: { id }, data: dto });
  }

  async removeAddress(customerId: string, id: string) {
    const address = await this.prisma.customerAddress.findFirst({ where: { id, customerId } });
    if (!address) throw new NotFoundException('Address not found');

    await this.prisma.customerAddress.delete({ where: { id } });
    return { message: 'Address deleted successfully' };
  }

  // ---------- Favorite Restaurants ----------

  async addFavorite(customerId: string, restaurantId: string) {
    const existing = await this.prisma.customerFavorite.findUnique({
      where: { customerId_restaurantId: { customerId, restaurantId } },
    });
    if (existing) throw new ConflictException('Restaurant is already in favorites');

    return this.prisma.customerFavorite.create({ data: { customerId, restaurantId } });
  }

  async findAllFavorites(customerId: string) {
    return this.prisma.customerFavorite.findMany({
      where: { customerId },
      include: { restaurant: { select: { id: true, name: true, logoUrl: true, avgRating: true, city: true } } },
    });
  }

  async removeFavorite(customerId: string, restaurantId: string) {
    await this.prisma.customerFavorite.deleteMany({ where: { customerId, restaurantId } });
    return { message: 'Removed from favorites' };
  }
}
