//src/modules/delivery/guards/delivery-jwt-auth.guard.ts
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class DeliveryJwtAuthGuard extends AuthGuard('delivery-jwt') {}
