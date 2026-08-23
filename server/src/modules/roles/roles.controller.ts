import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@ApiTags('Roles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  create(@Req() req, @Body() dto: CreateRoleDto) {
    return this.rolesService.create(req.user.tenantId, dto);
  }

  @Get()
  findAll(@Req() req) {
    return this.rolesService.findAll(req.user.tenantId);
  }

  @Get(':id')
  findOne(@Req() req, @Param('id') id: string) {
    return this.rolesService.findOne(req.user.tenantId, id);
  }

  @Put(':id')
  update(@Req() req, @Param('id') id: string, @Body() dto: UpdateRoleDto) {
    return this.rolesService.update(req.user.tenantId, id, dto);
  }

  @Delete(':id')
  remove(@Req() req, @Param('id') id: string) {
    return this.rolesService.remove(req.user.tenantId, id);
  }

  @Post(':id/permissions/:permissionId')
  assignPermission(@Req() req, @Param('id') id: string, @Param('permissionId') permissionId: string) {
    return this.rolesService.assignPermission(req.user.tenantId, id, permissionId);
  }

  @Delete(':id/permissions/:permissionId')
  removePermission(@Req() req, @Param('id') id: string, @Param('permissionId') permissionId: string) {
    return this.rolesService.removePermission(req.user.tenantId, id, permissionId);
  }
}
