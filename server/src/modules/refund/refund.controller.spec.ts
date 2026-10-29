import 'reflect-metadata';
import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { RefundController } from './refund.controller';
import { PlatformStaffJwtAuthGuard } from '../platform-auth/guards/platform-staff-jwt-auth.guard';
import { PlatformPermissionGuard } from '../platform-auth/guards/platform-permission.guard';
import { PLATFORM_PERMISSION_KEY } from '../platform-auth/decorators/require-permission.decorator';

describe('RefundController access control', () => {
  it('requires a platform staff login for every route', () => {
    const guards: unknown[] = Reflect.getMetadata('__guards__', RefundController);
    assert.deepEqual(guards, [PlatformStaffJwtAuthGuard, PlatformPermissionGuard]);
  });

  for (const route of ['getPendingRefunds', 'processRefund'] as const) {
    it(`${route} requires the PROCESS_REFUNDS permission`, () => {
      const permissions = Reflect.getMetadata(PLATFORM_PERMISSION_KEY, RefundController.prototype[route]);
      assert.deepEqual(permissions, ['PROCESS_REFUNDS']);
    });
  }
});
