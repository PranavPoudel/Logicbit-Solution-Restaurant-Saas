import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';

export interface CustomerJwtPayload {
  sub: string;
  email: string;
  name: string;
  type: 'customer';
  /** Token version. Tokens issued before it existed have none and count as version 0. */
  tv?: number;
}

@Injectable()
export class CustomerJwtStrategy extends PassportStrategy(Strategy, 'customer-jwt') {
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

  /** Checked against the database on every request, so a password reset or "log out everywhere" takes effect at once. */
  async validate(payload: CustomerJwtPayload) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: payload.sub },
      select: { isActive: true, tokenVersion: true },
    });
    if (!customer || !customer.isActive || (payload.tv ?? 0) !== customer.tokenVersion) {
      throw new UnauthorizedException('Session is no longer valid. Please log in again.');
    }
    return { id: payload.sub, email: payload.email, name: payload.name, type: 'customer' };
  }
}
