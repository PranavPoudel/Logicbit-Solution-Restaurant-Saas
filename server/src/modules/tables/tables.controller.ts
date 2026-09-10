// modules/tables/tables.controller.ts
import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TablesService } from './tables.service';
import { CreateTableDto } from './dto/create-table.dto';
import { UpdateTableDto } from './dto/update-table.dto';

@ApiTags('Tables')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/restaurants/:restaurantId/tables')
export class TablesController {
  constructor(private readonly tablesService: TablesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new restaurant table' })
  create(@Req() req, @Param('restaurantId') restaurantId: string, @Body() dto: CreateTableDto) {
    return this.tablesService.create(req.user.tenantId, restaurantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all tables for a restaurant, optionally including soft-deleted ones' })
  findAll(
    @Req() req,
    @Param('restaurantId') restaurantId: string,
    @Query('includeDeleted') includeDeleted?: string | boolean
  ) {
    const isDeletedIncluded = includeDeleted === 'true' || includeDeleted === true;
    return this.tablesService.findAll(req.user.tenantId, restaurantId, isDeletedIncluded);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single table by ID' })
  findOne(@Req() req, @Param('restaurantId') restaurantId: string, @Param('id') id: string) {
    return this.tablesService.findOne(req.user.tenantId, restaurantId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a table' })
  update(@Req() req, @Param('restaurantId') restaurantId: string, @Param('id') id: string, @Body() dto: UpdateTableDto) {
    return this.tablesService.update(req.user.tenantId, restaurantId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete a table (moves to trash)' })
  remove(@Req() req, @Param('restaurantId') restaurantId: string, @Param('id') id: string) {
    return this.tablesService.remove(req.user.tenantId, restaurantId, id);
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'Restore a soft-deleted table from trash' })
  restore(@Req() req, @Param('restaurantId') restaurantId: string, @Param('id') id: string) {
    return this.tablesService.restore(req.user.tenantId, restaurantId, id);
  }

  @Delete(':id/permanent')
  @ApiOperation({ summary: 'Permanently delete a soft-deleted table' })
  permanentDelete(@Req() req, @Param('restaurantId') restaurantId: string, @Param('id') id: string) {
    return this.tablesService.permanentDelete(req.user.tenantId, restaurantId, id);
  }
}