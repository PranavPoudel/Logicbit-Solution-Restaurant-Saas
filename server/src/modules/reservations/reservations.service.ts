import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';

@Injectable()
export class ReservationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, restaurantId: string, dto: CreateReservationDto) {
    const restaurant = await this.prisma.restaurant.findFirst({ where: { id: restaurantId, tenantId } });
    if (!restaurant) throw new NotFoundException('Restaurant not found for this tenant');

    // Optional: Check if table exists and belongs to this restaurant
    if (dto.tableId) {
      const table = await this.prisma.restaurantTable.findFirst({ where: { id: dto.tableId, restaurantId, deletedAt: null } });
      if (!table) throw new NotFoundException('Table not found or inactive');
    }

    return this.prisma.reservation.create({
      data: { ...dto, tenantId, restaurantId },
      include: { table: { select: { name: true } } },
    });
    }

  async findAll(tenantId: string, restaurantId: string, includeDeleted = false, status?: string, date?: string) {
    const whereClause: any = {
      tenantId,
      restaurantId,
      deletedAt: includeDeleted ? { not: null } : null,
    };

    if (status && status !== 'ALL') {
      whereClause.status = status;
    }
    if (date) {
      // Filter by specific date (ignoring time)
      const startOfDay = new Date(date);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      whereClause.reservationDate = { gte: startOfDay, lte: endOfDay };
    }

    return this.prisma.reservation.findMany({
      where: whereClause,
      include: { table: { select: { name: true, capacity: true } } },
      orderBy: [{ reservationDate: 'asc' }, { reservationTime: 'asc' }],
    });
  }

  async findOne(tenantId: string, restaurantId: string, id: string) {
    const reservation = await this.prisma.reservation.findFirst({ 
      where: { id, tenantId, restaurantId, deletedAt: null },
      include: { table: true }
    });
    if (!reservation) throw new NotFoundException('Reservation not found');
    return reservation;
  }

  async update(tenantId: string, restaurantId: string, id: string, dto: UpdateReservationDto) {
    await this.findOne(tenantId, restaurantId, id);

    if (dto.tableId) {
      const table = await this.prisma.restaurantTable.findFirst({ where: { id: dto.tableId, restaurantId, deletedAt: null } });
      if (!table) throw new NotFoundException('Table not found or inactive');
    }

    return this.prisma.reservation.update({
      where: { id, tenantId, restaurantId },
      data: dto,
      include: { table: { select: { name: true } } },
    });
  }

  async remove(tenantId: string, restaurantId: string, id: string) {
    await this.findOne(tenantId, restaurantId, id);
    return this.prisma.reservation.update({
      where: { id, tenantId, restaurantId },
      data: { deletedAt: new Date(), status: 'CANCELLED' },
    });
  }

  async restore(tenantId: string, restaurantId: string, id: string) {
    const reservation = await this.prisma.reservation.findFirst({ 
      where: { id, tenantId, restaurantId, deletedAt: { not: null } } 
    });
    if (!reservation) throw new NotFoundException('Reservation not found in trash');

    return this.prisma.reservation.update({
      where: { id, tenantId, restaurantId },
      data: { deletedAt: null, status: 'PENDING' }, // Reset to pending on restore
    });
  }

  async permanentDelete(tenantId: string, restaurantId: string, id: string) {
    return this.prisma.reservation.delete({ where: { id, tenantId, restaurantId } });
  }
}