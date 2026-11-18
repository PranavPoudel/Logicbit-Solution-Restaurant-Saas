import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { UnauthorizedException } from '@nestjs/common';
import { CustomerJwtStrategy } from './customer-jwt.strategy';

const strategy = (customer: { isActive: boolean; tokenVersion: number } | null) =>
  new CustomerJwtStrategy({ get: () => 'test-secret' } as any, { customer: { findUnique: async () => customer } } as any);

const payload = (tv?: number) => ({ sub: 'c1', email: 'a@b.test', name: 'Sita', type: 'customer' as const, tv });

describe('CustomerJwtStrategy.validate', () => {
  it('accepts a token that matches the account version', async () => {
    assert.equal((await strategy({ isActive: true, tokenVersion: 2 }).validate(payload(2))).id, 'c1');
  });

  it('accepts older tokens without a version while the account is still at version 0', async () => {
    assert.equal((await strategy({ isActive: true, tokenVersion: 0 }).validate(payload(undefined))).id, 'c1');
  });

  it('rejects a token from before a password reset or log-out-everywhere', async () => {
    await assert.rejects(strategy({ isActive: true, tokenVersion: 3 }).validate(payload(2)), UnauthorizedException);
    await assert.rejects(strategy({ isActive: true, tokenVersion: 1 }).validate(payload(undefined)), UnauthorizedException);
  });

  it('rejects deactivated and deleted accounts', async () => {
    await assert.rejects(strategy({ isActive: false, tokenVersion: 0 }).validate(payload(0)), UnauthorizedException);
    await assert.rejects(strategy(null).validate(payload(0)), UnauthorizedException);
  });
});
