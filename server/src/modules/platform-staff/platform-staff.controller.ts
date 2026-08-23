import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PlatformStaffJwtAuthGuard } from '../platform-auth/guards/platform-staff-jwt-auth.guard';
import { PlatformPermissionGuard } from '../platform-auth/guards/platform-permission.guard';
import { RequirePlatformPermission } from '../platform-auth/decorators/require-permission.decorator';
import { PlatformStaffService } from './platform-staff.service';
import { CreatePlatformRoleDto, CreatePlatformStaffDto, UpdatePlatformStaffDto } from './dto/platform-staff.dto';

@ApiTags('Platform Staff Management')
@ApiBearerAuth()
@UseGuards(PlatformStaffJwtAuthGuard, PlatformPermissionGuard)
@Controller('api/v1/platform-admin/staff')
export class PlatformStaffController {
  constructor(private readonly platformStaffService: PlatformStaffService) {}

  @Get('permissions')
  findAllPermissions() {
    return this.platformStaffService.findAllPermissions();
  }

  @Get('roles')
  findAllRoles() {
    return this.platformStaffService.findAllRoles();
  }

  @Post('roles')
  @RequirePlatformPermission('MANAGE_PLATFORM_STAFF')
  createRole(@Body() dto: CreatePlatformRoleDto) {
    return this.platformStaffService.createRole(dto);
  }

  @Post('roles/:roleId/permissions/:permissionId')
  @RequirePlatformPermission('MANAGE_PLATFORM_STAFF')
  assignPermission(@Param('roleId') roleId: string, @Param('permissionId') permissionId: string) {
    return this.platformStaffService.assignPermission(roleId, permissionId);
  }

  @Get()
  @RequirePlatformPermission('MANAGE_PLATFORM_STAFF')
  findAllStaff() {
    return this.platformStaffService.findAllStaff();
  }

  @Post()
  @RequirePlatformPermission('MANAGE_PLATFORM_STAFF')
  createStaff(@Body() dto: CreatePlatformStaffDto) {
    return this.platformStaffService.createStaff(dto);
  }

  @Patch(':id')
  @RequirePlatformPermission('MANAGE_PLATFORM_STAFF')
  updateStaff(@Param('id') id: string, @Body() dto: UpdatePlatformStaffDto) {
    return this.platformStaffService.updateStaff(id, dto);
  }
}
