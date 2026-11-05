import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PlatformStaffJwtAuthGuard } from '../platform-auth/guards/platform-staff-jwt-auth.guard';
import { PlatformPermissionGuard } from '../platform-auth/guards/platform-permission.guard';
import { RequirePlatformPermission } from '../platform-auth/decorators/require-permission.decorator';
import { CityService } from './city.service';
import { CreateCityDto, UpdateCityDto } from './dto/city.dto';

@ApiTags('City - Public')
@Controller('api/v1/discovery/cities')
export class PublicCityController {
  constructor(private readonly cityService: CityService) {}

  @Get()
  findAll() {
    return this.cityService.findAllActive();
  }
}

@ApiTags('City - Platform Admin')
@ApiBearerAuth()
@UseGuards(PlatformStaffJwtAuthGuard, PlatformPermissionGuard)
@Controller('api/v1/platform-admin/cities')
export class PlatformCityController {
  constructor(private readonly cityService: CityService) {}

  @Get()
  @RequirePlatformPermission('MANAGE_CITIES')
  findAll() {
    return this.cityService.findAll();
  }

  @Post()
  @RequirePlatformPermission('MANAGE_CITIES')
  create(@Body() dto: CreateCityDto) {
    return this.cityService.create(dto);
  }

  @Patch(':id')
  @RequirePlatformPermission('MANAGE_CITIES')
  update(@Param('id') id: string, @Body() dto: UpdateCityDto) {
    return this.cityService.update(id, dto);
  }

  @Delete(':id')
  @RequirePlatformPermission('MANAGE_CITIES')
  remove(@Param('id') id: string) {
    return this.cityService.remove(id);
  }
}
