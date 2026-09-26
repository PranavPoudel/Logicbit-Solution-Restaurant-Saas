import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ReservationsService } from './reservations.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';

@ApiTags('Reservations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/restaurants/:restaurantId/reservations')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new reservation' })
  create(@Req() req, @Param('restaurantId') restaurantId: string, @Body() dto: CreateReservationDto) {
    return this.reservationsService.create(req.user.tenantId, restaurantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all reservations, with optional date/status filters and trash inclusion' })
  findAll(
    @Req() req,
    @Param('restaurantId') restaurantId: string,
    @Query('includeDeleted') includeDeleted?: string | boolean,
    @Query('status') status?: string,
    @Query('date') date?: string
  ) {
    const isDeletedIncluded = includeDeleted === 'true' || includeDeleted === true;
    return this.reservationsService.findAll(req.user.tenantId, restaurantId, isDeletedIncluded, status, date);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single reservation by ID' })
  findOne(@Req() req, @Param('restaurantId') restaurantId: string, @Param('id') id: string) {
    return this.reservationsService.findOne(req.user.tenantId, restaurantId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a reservation' })
  update(@Req() req, @Param('restaurantId') restaurantId: string, @Param('id') id: string, @Body() dto: UpdateReservationDto) {
    return this.reservationsService.update(req.user.tenantId, restaurantId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete a reservation (moves to trash)' })
  remove(@Req() req, @Param('restaurantId') restaurantId: string, @Param('id') id: string) {
    return this.reservationsService.remove(req.user.tenantId, restaurantId, id);
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'Restore a soft-deleted reservation from trash' })
  restore(@Req() req, @Param('restaurantId') restaurantId: string, @Param('id') id: string) {
    return this.reservationsService.restore(req.user.tenantId, restaurantId, id);
  }

  @Delete(':id/permanent')
  @ApiOperation({ summary: 'Permanently delete a soft-deleted reservation' })
  permanentDelete(@Req() req, @Param('restaurantId') restaurantId: string, @Param('id') id: string) {
    return this.reservationsService.permanentDelete(req.user.tenantId, restaurantId, id);
  }
}