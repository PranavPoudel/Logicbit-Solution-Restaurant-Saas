import 'reflect-metadata';
import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { validate } from 'class-validator';
import { PlatformStaffJwtAuthGuard } from '../platform-auth/guards/platform-staff-jwt-auth.guard';
import { PlatformPermissionGuard } from '../platform-auth/guards/platform-permission.guard';
import { PLATFORM_PERMISSION_KEY } from '../platform-auth/decorators/require-permission.decorator';
import { AdminSubscriptionController } from './platform-admin-subscription.controller';
import { ManualAssignDto } from './dto/manual-assign.dto';

describe('AdminSubscriptionController', () => {
  it('only lets signed-in platform staff in', () => {
    const guards = Reflect.getMetadata('__guards__', AdminSubscriptionController);
    assert.ok(guards.includes(PlatformStaffJwtAuthGuard));
    assert.ok(guards.includes(PlatformPermissionGuard));
  });

  it('needs the MANAGE_SUBSCRIPTIONS permission to assign a plan', () => {
    const required = Reflect.getMetadata(PLATFORM_PERMISSION_KEY, AdminSubscriptionController.prototype.assignSubscription);
    assert.deepEqual(required, ['MANAGE_SUBSCRIPTIONS']);
  });
});

describe('ManualAssignDto', () => {
  const dto = (over: Partial<ManualAssignDto> = {}) =>
    Object.assign(new ManualAssignDto(), { restaurantId: '8ee4cecb-9f23-413c-91da-074eb7aadcac', planId: 'd7281050-ec37-46a9-88ed-20f82be46461', mode: 'MANUAL', ...over });

  it('accepts a restaurant, a plan and a billing mode', async () => {
    assert.equal((await validate(dto())).length, 0);
  });

  it('rejects an empty body, bad ids and an unknown mode', async () => {
    assert.ok((await validate(new ManualAssignDto())).length >= 3);
    assert.ok((await validate(dto({ restaurantId: 'nope' }))).length > 0);
    assert.ok((await validate(dto({ mode: 'WEEKLY' as any }))).length > 0);
  });
});
