import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';

export interface PlatformStaffJwtPayload {
  sub: string;
  email: string;
  roleName: string;
  type: 'platform-staff';
}

@Injectable()
export class PlatformStaffJwtStrategy extends PassportStrategy(Strategy, 'platform-staff-jwt') {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_ACCESS_SECRET'),
    });
  }

  async validate(payload: PlatformStaffJwtPayload) {
    // DB बाट real-time permission निकालिन्छ (token मा राखिँदैन) — ताकि
    // role बदलिनेबित्तिकै (token expire नकुरी) नयाँ permission लागू होस्।
    const staff = await this.prisma.platformStaff.findUnique({
      where: { id: payload.sub },
      include: { role: { include: { permissions: { include: { permission: true } } } } },
    });
    if (!staff || !staff.isActive) throw new UnauthorizedException('Platform staff account is not active');

    return {
      id: staff.id,
      email: staff.email,
      name: staff.name,
      roleName: staff.role.name,
      permissions: staff.role.permissions.map((p) => p.permission.name),
      type: 'platform-staff',
    };
  }
}
