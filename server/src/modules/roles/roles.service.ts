import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateRoleDto) {
    const existing = await this.prisma.role.findFirst({ where: { tenantId, name: dto.name } });
    if (existing) {
      throw new ConflictException(`Role "${dto.name}" already exists`);
    }
    return this.prisma.role.create({ data: { tenantId, name: dto.name } });
  }

  async findAll(tenantId: string) {
    return this.prisma.role.findMany({
      where: { tenantId },
      include: { permissions: { include: { permission: true } } },
    });
  }

  async findOne(tenantId: string, id: string) {
    const role = await this.prisma.role.findFirst({
      where: { id, tenantId },
      include: { permissions: { include: { permission: true } } },
    });
    if (!role) throw new NotFoundException('Role not found');
    return role;
  }

  async update(tenantId: string, id: string, dto: UpdateRoleDto) {
    await this.findOne(tenantId, id);
    await this.prisma.role.updateMany({ where: { id, tenantId }, data: dto });
    return this.findOne(tenantId, id);
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id);
    await this.prisma.role.deleteMany({ where: { id, tenantId } });
    return { message: 'Role deleted successfully' };
  }

  async assignPermission(tenantId: string, roleId: string, permissionId: string) {
    await this.findOne(tenantId, roleId);
    const permission = await this.prisma.permission.findUnique({ where: { id: permissionId } });
    if (!permission) throw new NotFoundException('Permission not found');

    const existing = await this.prisma.rolePermission.findFirst({ where: { roleId, permissionId } });
    if (existing) throw new ConflictException('Permission already assigned to this role');

    await this.prisma.rolePermission.create({ data: { roleId, permissionId } });
    return this.findOne(tenantId, roleId);
  }

  async removePermission(tenantId: string, roleId: string, permissionId: string) {
    await this.findOne(tenantId, roleId);
    await this.prisma.rolePermission.deleteMany({ where: { roleId, permissionId } });
    return this.findOne(tenantId, roleId);
  }
}
