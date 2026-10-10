// src/modules/delivery/strategies/delivery-jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';

export interface DeliveryJwtPayload {
  sub: string;
  phone: string;
  type: 'delivery';
}

@Injectable()
export class DeliveryJwtStrategy extends PassportStrategy(Strategy, 'delivery-jwt') {
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

  async validate(payload: DeliveryJwtPayload) {
    const person = await this.prisma.deliveryPerson.findUnique({ where: { id: payload.sub } });
    if (!person || !person.isActive) throw new UnauthorizedException('Delivery account is not active');
    return { id: person.id, name: person.name, phone: person.phone, type: 'delivery' };
  }
}
