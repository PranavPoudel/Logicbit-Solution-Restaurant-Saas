// modules/reservations/reservations.service.ts
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';

@Injectable()
export class ReservationsService {
  constructor(private readonly prisma: PrismaService) {}

  // Helper: Combine date + time into a proper ISO-8601 DateTime
  private buildReservationDateTime(date: string, time: string): Date {
    // date = "2026-09-10", time = "15:00"
    // Result: "2026-09-10T15:00:00.000Z"
    return new Date(`${date}T${time}:00.000Z`);
  }

  async create(tenantId: string, restaurantId: string, dto: CreateReservationDto) {
    const restaurant = await this.prisma.restaurant.findFirst({ 
      where: { id: restaurantId, tenantId } 
    });
    if (!restaurant) throw new NotFoundException('Restaurant not found for this tenant');

    // Validate table if provided
    if (dto.tableId) {
      const table = await this.prisma.restaurantTable.findFirst({ 
        where: { id: dto.tableId, restaurantId, tenantId, deletedAt: null } 
      });
      if (!table) throw new NotFoundException('Table not found or inactive');
    }

    // Convert date + time strings into a proper DateTime for Prisma
    const reservationDateTime = this.buildReservationDateTime(dto.reservationDate, dto.reservationTime);

    return this.prisma.reservation.create({
      data: {
        ...dto,
        tenantId,
        restaurantId,
        reservationDate: reservationDateTime, // ✅ Now a proper Date object
      },
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
      const startOfDay = new Date(`${date}T00:00:00.000Z`);
      const endOfDay = new Date(`${date}T23:59:59.999Z`);
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

    // Validate table if being updated
    if (dto.tableId) {
      const table = await this.prisma.restaurantTable.findFirst({ 
        where: { id: dto.tableId, restaurantId, tenantId, deletedAt: null } 
      });
      if (!table) throw new NotFoundException('Table not found or inactive');
    }

    // Convert date + time if both are provided in the update
    let reservationDateTime: Date | undefined;
    if (dto.reservationDate && dto.reservationTime) {
      reservationDateTime = this.buildReservationDateTime(dto.reservationDate, dto.reservationTime);
    }

    return this.prisma.reservation.update({
      where: { id, tenantId, restaurantId },
      data: {
        ...dto,
        ...(reservationDateTime && { reservationDate: reservationDateTime }),
      },
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
      data: { deletedAt: null, status: 'PENDING' },
    });
  }

  async permanentDelete(tenantId: string, restaurantId: string, id: string) {
    return this.prisma.reservation.delete({ where: { id, tenantId, restaurantId } });
  }
}