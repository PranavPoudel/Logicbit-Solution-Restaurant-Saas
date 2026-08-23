import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginPlatformStaffDto } from './dto/platform-auth.dto';

@Injectable()
export class PlatformAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(dto: LoginPlatformStaffDto) {
    const staff = await this.prisma.platformStaff.findUnique({
      where: { email: dto.email },
      include: { role: { include: { permissions: { include: { permission: true } } } } },
    });
    if (!staff || !staff.isActive) throw new UnauthorizedException('Invalid credentials');

    const matches = await bcrypt.compare(dto.password, staff.passwordHash);
    if (!matches) throw new UnauthorizedException('Invalid credentials');

    const payload = { sub: staff.id, email: staff.email, roleName: staff.role.name, type: 'platform-staff' };
    const accessToken = await this.jwt.signAsync(payload, {
      secret: this.config.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: this.config.get<string>('JWT_ACCESS_EXPIRES_IN'),
    });

    return {
      success: true,
      data: {
        staff: { id: staff.id, name: staff.name, email: staff.email, role: staff.role.name },
        permissions: staff.role.permissions.map((p) => p.permission.name),
        accessToken,
      },
    };
  }
}
