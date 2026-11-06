import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { UnauthorizedException } from '@nestjs/common';
import { CustomerAuthService } from './customer-auth.service';
import { hashPassword } from '../account-security/passwords';
import { fakeTable } from '../account-security/fake-db';

async function setup() {
  const rows: any[] = [{ id: 'c1', name: 'Sita', email: 'sita@example.com', tokenVersion: 4, passwordHash: await hashPassword('old-password') }];
  const prisma = { customer: fakeTable(rows) };
  const jwt = { signAsync: async (payload: any) => JSON.stringify(payload) };
  const config = { get: () => '15m' };
  const audits: string[] = [];
  const security = { audit: (_t: string, _a: unknown, action: string) => void audits.push(action) };
  const service = new CustomerAuthService(prisma as any, jwt as any, config as any, security as any);
  return { service, rows, audits };
}

describe('CustomerAuthService.changePassword', () => {
  it('ends the other sessions and gives this device a token for the new version', async () => {
    const { service, rows, audits } = await setup();
    const result = await service.changePassword('c1', 'old-password', 'new-password-1');
    assert.equal(rows[0].tokenVersion, 5);
    assert.equal(JSON.parse(result.data.tokens.accessToken).tv, 5);
    assert.deepEqual(audits, ['AUTH_PASSWORD_CHANGED']);
  });

  it('changes nothing when the current password is wrong', async () => {
    const { service, rows } = await setup();
    await assert.rejects(service.changePassword('c1', 'not-it', 'new-password-1'), UnauthorizedException);
    assert.equal(rows[0].tokenVersion, 4);
  });
});
