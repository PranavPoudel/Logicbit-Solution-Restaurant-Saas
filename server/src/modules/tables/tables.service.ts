// modules/tables/tables.service.ts
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTableDto } from './dto/create-table.dto';
import { UpdateTableDto } from './dto/update-table.dto';

@Injectable()
export class TablesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, restaurantId: string, dto: CreateTableDto) {
    const restaurant = await this.prisma.restaurant.findFirst({ 
      where: { id: restaurantId, tenantId } 
    });
    if (!restaurant) throw new NotFoundException('Restaurant not found for this tenant');

    // Check for duplicate table name in the same restaurant
    const existing = await this.prisma.restaurantTable.findFirst({ 
      where: { tenantId, restaurantId, name: dto.name, deletedAt: null } 
    });
    if (existing) throw new ConflictException(`Table "${dto.name}" already exists in this restaurant`);

    return this.prisma.restaurantTable.create({ 
      data: { ...dto, tenantId, restaurantId } 
    });
  }

  async findAll(tenantId: string, restaurantId: string, includeDeleted = false) {
    return this.prisma.restaurantTable.findMany({
      where: {
        tenantId,
        restaurantId,
        deletedAt: includeDeleted ? { not: null } : null,
      },
      include: {
        // Include active reservations count for each table
        reservations: {
          where: { deletedAt: null, status: { not: 'CANCELLED' } },
          select: { id: true },
        },
      },
      orderBy: { displayOrder: 'asc' },
    });
  }

  async findOne(tenantId: string, restaurantId: string, id: string) {
    const table = await this.prisma.restaurantTable.findFirst({ 
      where: { id, tenantId, restaurantId, deletedAt: null } 
    });
    if (!table) throw new NotFoundException('Table not found');
    return table;
  }

  async update(tenantId: string, restaurantId: string, id: string, dto: UpdateTableDto) {
    await this.findOne(tenantId, restaurantId, id);

    // Check for duplicate name if name is being changed
    if (dto.name) {
      const duplicate = await this.prisma.restaurantTable.findFirst({
        where: { tenantId, restaurantId, name: dto.name, NOT: { id }, deletedAt: null },
      });
      if (duplicate) throw new ConflictException(`Table "${dto.name}" already exists in this restaurant`);
    }

    return this.prisma.restaurantTable.update({ 
      where: { id, tenantId, restaurantId }, 
      data: dto 
    });
  }

  async remove(tenantId: string, restaurantId: string, id: string) {
    await this.findOne(tenantId, restaurantId, id);

    // Check if table has active reservations
    const activeReservations = await this.prisma.reservation.count({
      where: { tableId: id, tenantId, restaurantId, deletedAt: null, status: { not: 'CANCELLED' } }
    });
    if (activeReservations > 0) {
      throw new ConflictException(`Cannot delete: ${activeReservations} active reservation(s) linked to this table`);
    }

    // Soft delete
    return this.prisma.restaurantTable.update({
      where: { id, tenantId, restaurantId },
      data: { deletedAt: new Date() },
    });
  }

  async restore(tenantId: string, restaurantId: string, id: string) {
    const table = await this.prisma.restaurantTable.findFirst({ 
      where: { id, tenantId, restaurantId, deletedAt: { not: null } } 
    });
    if (!table) throw new NotFoundException('Table not found in trash');

    return this.prisma.restaurantTable.update({
      where: { id, tenantId, restaurantId },
      data: { deletedAt: null },
    });
  }

  async permanentDelete(tenantId: string, restaurantId: string, id: string) {
    const table = await this.prisma.restaurantTable.findFirst({ 
      where: { id, tenantId, restaurantId } 
    });
    if (!table) throw new NotFoundException('Table not found');

    return this.prisma.restaurantTable.delete({
      where: { id, tenantId, restaurantId },
    });
  }
}
