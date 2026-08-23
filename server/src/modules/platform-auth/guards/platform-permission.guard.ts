import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PLATFORM_PERMISSION_KEY } from '../decorators/require-permission.decorator';

/**
 * PlatformPermissionGuard
 * -------------------------
 * GAP FIX: पहिले Platform Admin भनेको "सबै-वा-केही" (isPlatformAdmin
 * boolean) मात्र थियो — Super Admin ले Support Staff राख्न चाहे पनि
 * "यो व्यक्तिले केवल हेर्न पाओस्, suspend/commission भने नगरोस्" भन्ने
 * granular control सम्भव थिएन। अब @RequirePlatformPermission() decorator
 * भएको हरेक endpoint मा, staff को role मा त्यो specific permission
 * नभए 403 दिइन्छ।
 *
 * Decorator नभएको endpoint (जस्तै GET-only, sensitive नभएको) मा यो
 * guard ले जे भए पनि पास दिन्छ — केवल explicitly तोकिएको permission
 * मात्र enforce हुन्छ।
 */
@Injectable()
export class PlatformPermissionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.get<string[]>(PLATFORM_PERMISSION_KEY, context.getHandler());
    if (!requiredPermissions || requiredPermissions.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const staffPermissions: string[] = request.user?.permissions ?? [];

    const hasPermission = requiredPermissions.some((p) => staffPermissions.includes(p));
    if (!hasPermission) {
      throw new ForbiddenException(`Missing required permission: ${requiredPermissions.join(' or ')}`);
    }
    return true;
  }
}
