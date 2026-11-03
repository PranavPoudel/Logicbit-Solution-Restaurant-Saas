import { CanActivate, ExecutionContext, ForbiddenException, Injectable, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../../prisma/prisma.service';

/** Why a restaurant's membership blocks the owner dashboard, or null when it is fine. A plan with no expiry date never lapses. */
export function subscriptionBlockedReason(
  subscription: { status: string; expiryDate: Date | null } | null,
  now = new Date(),
): string | null {
  if (!subscription) return 'No active membership. Please choose a plan to continue.';
  if (subscription.status !== 'ACTIVE' || (subscription.expiryDate && subscription.expiryDate <= now)) {
    return 'Your membership has expired. Please renew it to continue.';
  }
  return null;
}

const ALLOW_WITHOUT_PLAN = 'allowWithoutPlan';

/** Marks a controller as usable by a restaurant that has no plan yet (an expired plan is still blocked). */
export const AllowWithoutPlan = () => SetMetadata(ALLOW_WITHOUT_PLAN, true);

/** Use after JwtAuthGuard on owner routes that carry `:restaurantId`. Not for the subscription and payment routes, so an owner can always renew. */
@Injectable()
export class SubscriptionActiveGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService, private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const restaurantId: string | undefined = req.params?.restaurantId;
    if (!restaurantId) return true;

    // Not the caller's restaurant: let the route answer 404 instead of leaking its membership state.
    const restaurant = await this.prisma.restaurant.findFirst({ where: { id: restaurantId, tenantId: req.user?.tenantId }, select: { id: true } });
    if (!restaurant) return true;

    const subscription = await this.prisma.restaurantSubscription.findUnique({
      where: { restaurantId },
      select: { status: true, expiryDate: true },
    });
    if (!subscription && this.reflector.getAllAndOverride<boolean>(ALLOW_WITHOUT_PLAN, [context.getHandler(), context.getClass()])) return true;
    const reason = subscriptionBlockedReason(subscription);
    if (reason) throw new ForbiddenException({ message: reason, error: 'SUBSCRIPTION_INACTIVE' });
    return true;
  }
}
