import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePlatformRoleDto, CreatePlatformStaffDto, UpdatePlatformStaffDto } from './dto/platform-staff.dto';

const SALT_ROUNDS = 10;

@Injectable()
export class PlatformStaffService {
  constructor(private readonly prisma: PrismaService) {}

  // ---------- Permissions (Read-only list — system-defined) ----------

  async findAllPermissions() {
    return this.prisma.platformPermission.findMany({ orderBy: { name: 'asc' } });
  }

  // ---------- Roles ----------

  async createRole(dto: CreatePlatformRoleDto) {
    const existing = await this.prisma.platformRole.findUnique({ where: { name: dto.name } });
    if (existing) throw new ConflictException(`Role "${dto.name}" already exists`);
    return this.prisma.platformRole.create({ data: { name: dto.name } });
  }

  async findAllRoles() {
    return this.prisma.platformRole.findMany({ include: { permissions: { include: { permission: true } } } });
  }

  async assignPermission(roleId: string, permissionId: string) {
    const role = await this.prisma.platformRole.findUnique({ where: { id: roleId } });
    if (!role) throw new NotFoundException('Role not found');

    const existing = await this.prisma.platformRolePermission.findFirst({ where: { roleId, permissionId } });
    if (existing) throw new ConflictException('Permission already assigned');

    await this.prisma.platformRolePermission.create({ data: { roleId, permissionId } });
    return this.prisma.platformRole.findUnique({ where: { id: roleId }, include: { permissions: { include: { permission: true } } } });
  }

  async removePermission(roleId: string, permissionId: string) {
    await this.prisma.platformRolePermission.deleteMany({ where: { roleId, permissionId } });
    return this.prisma.platformRole.findUnique({ where: { id: roleId }, include: { permissions: { include: { permission: true } } } });
  }

  // ---------- Staff ----------

  async createStaff(dto: CreatePlatformStaffDto) {
    const existing = await this.prisma.platformStaff.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('A platform staff with this email already exists');

    const role = await this.prisma.platformRole.findUnique({ where: { id: dto.roleId } });
    if (!role) throw new NotFoundException('Role not found');

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const staff = await this.prisma.platformStaff.create({
      data: { name: dto.name, email: dto.email, passwordHash, roleId: dto.roleId },
    });

    return { id: staff.id, name: staff.name, email: staff.email, role: role.name };
  }

  async findAllStaff() {
    const staff = await this.prisma.platformStaff.findMany({ include: { role: true } });
    return staff.map((s) => ({ id: s.id, name: s.name, email: s.email, role: s.role.name, isActive: s.isActive }));
  }

  async updateStaff(id: string, dto: UpdatePlatformStaffDto) {
    const staff = await this.prisma.platformStaff.findUnique({ where: { id } });
    if (!staff) throw new NotFoundException('Platform staff not found');

    return this.prisma.platformStaff.update({ where: { id }, data: dto });
  }
}
