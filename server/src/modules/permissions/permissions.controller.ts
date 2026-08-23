import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PlatformStaffJwtAuthGuard } from '../platform-auth/guards/platform-staff-jwt-auth.guard';
import { PlatformPermissionGuard } from '../platform-auth/guards/platform-permission.guard';
import { RequirePlatformPermission } from '../platform-auth/decorators/require-permission.decorator';
import { PermissionsService } from './permissions.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';

/**
 * PermissionsController
 * ------------------------
 * GAP FIX: यो `Permission` model GLOBAL हो (सबै tenant ले साझा गर्छन्,
 * हरेक Role यसैबाट permission tान्छ) — त्यसैले यसको create/update/delete
 * कुनै पनि एक Restaurant Owner ले गर्न मिल्दैन (उनीहरूको isSuperAdmin
 * flag केवल आफ्नै tenant भित्र मात्र सही हो, global resource मा होइन)।
 * यसैले यहाँ Platform Staff auth (MANAGE_PLATFORM_STAFF-level trust)
 * प्रयोग गरिएको छ। Read (GET) भने कुनै पनि logged-in restaurant owner
 * ले गर्न मिल्छ (Role बनाउँदा उपलब्ध Permission list हेर्न चाहिन्छ)।
 */
@ApiTags('Permissions')
@ApiBearerAuth()
@Controller('api/v1/permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Post()
  @UseGuards(PlatformStaffJwtAuthGuard, PlatformPermissionGuard)
  @RequirePlatformPermission('MANAGE_PLATFORM_STAFF')
  create(@Body() dto: CreatePermissionDto) {
    return this.permissionsService.create(dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll() {
    return this.permissionsService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string) {
    return this.permissionsService.findOne(id);
  }

  @Put(':id')
  @UseGuards(PlatformStaffJwtAuthGuard, PlatformPermissionGuard)
  @RequirePlatformPermission('MANAGE_PLATFORM_STAFF')
  update(@Param('id') id: string, @Body() dto: UpdatePermissionDto) {
    return this.permissionsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(PlatformStaffJwtAuthGuard, PlatformPermissionGuard)
  @RequirePlatformPermission('MANAGE_PLATFORM_STAFF')
  remove(@Param('id') id: string) {
    return this.permissionsService.remove(id);
  }
}
