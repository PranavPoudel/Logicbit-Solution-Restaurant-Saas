import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';

export interface JwtPayload {
  sub: string;
  email: string;
  name: string;
  roles: string[];
  tenantId: string;
  isSuperAdmin: boolean;
  /** Token version. Tokens issued before it existed have none and count as version 0. */
  tv?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
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

  /**
   * validate()
   * -----------
   * SECURITY FIX: पहिले यसले token भित्रको payload लाई नै अन्तिम सत्य
   * मानेर सिधै फर्काउँथ्यो — यसको मतलब owner ले कुनै staff/user लाई
   * deactivate गरे पनि, उसको पुरानो token expire नभएसम्म (7 दिनसम्म)
   * काम गरिरहन्थ्यो। अब हरेक request मा DB बाट `isActive` ताजा जाँचिन्छ,
   * ताकि deactivate गरेको बित्तिकै access तुरुन्तै बन्द होस्।
   */
  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Account is no longer active');
    }
    if ((payload.tv ?? 0) !== user.tokenVersion) {
      throw new UnauthorizedException('Session is no longer valid. Please log in again.');
    }

    return {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      roles: payload.roles,
      tenantId: payload.tenantId,
      isSuperAdmin: payload.isSuperAdmin,
    };
  }
}
