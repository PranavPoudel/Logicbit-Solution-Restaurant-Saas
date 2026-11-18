import { afterEach, beforeEach, describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { BadRequestException, ForbiddenException, HttpException, UnauthorizedException } from '@nestjs/common';
import { AccountSecurityService } from './account-security.service';
import { OtpService } from './otp.service';
import { hashPassword } from './passwords';
import { MAX_FAILED_LOGINS } from './login-lock';
import { fakeTable, fakeTransaction } from './fake-db';

process.env.OTP_SECRET = 'test-secret';

let customers: any[];
let sent: any[];
let audits: any[];
let otp: OtpService;
let security: AccountSecurityService;

async function addCustomer(over: Record<string, unknown> = {}) {
  const row = {
    id: 'c1',
    name: 'Sita',
    email: 'sita@example.com',
    isActive: true,
    isGuest: false,
    emailVerified: true,
    failedLogins: 0,
    lockedUntil: null,
    tokenVersion: 0,
    passwordHash: await hashPassword('right-password'),
    ...over,
  };
  customers.push(row);
  return row;
}

const flush = async () => {
  for (let i = 0; i < 10; i++) await new Promise((resolve) => setImmediate(resolve));
};

beforeEach(() => {
  customers = [];
  sent = [];
  audits = [];
  const prisma = {
    customer: fakeTable(customers),
    user: fakeTable([]),
    otpCode: fakeTable([], { attempts: 0, consumedAt: null }),
    $transaction: fakeTransaction,
  };
  otp = new OtpService(prisma as any);
  const notifications = { mailer: {}, send: async (params: any) => void sent.push(params) };
  const activity = { log: async (entry: any) => void audits.push(entry) };
  security = new AccountSecurityService(prisma as any, otp, notifications as any, activity as any);
});

afterEach(() => {
  delete process.env.REQUIRE_EMAIL_VERIFICATION;
});

const actions = () => audits.map((a) => a.action);

describe('AccountSecurityService.authenticate', () => {
  it('logs in with the right password, ignoring email case, and records it', async () => {
    await addCustomer();
    const account = await security.authenticate('CUSTOMER', ' SITA@example.com ', 'right-password', { ip: '1.2.3.4' });
    assert.equal(account.id, 'c1');
    assert.deepEqual(actions(), ['AUTH_LOGIN_SUCCESS']);
    assert.equal(audits[0].metadata.ip, '1.2.3.4');
  });

  it('answers a wrong password and an unknown email the same way', async () => {
    await addCustomer();
    await assert.rejects(security.authenticate('CUSTOMER', 'sita@example.com', 'nope'), UnauthorizedException);
    await assert.rejects(security.authenticate('CUSTOMER', 'nobody@example.com', 'nope'), UnauthorizedException);
  });

  it('refuses an inactive account', async () => {
    await addCustomer({ isActive: false });
    await assert.rejects(security.authenticate('CUSTOMER', 'sita@example.com', 'right-password'), UnauthorizedException);
  });

  it('locks the account after too many wrong passwords, even for the right password', async () => {
    await addCustomer();
    for (let i = 0; i < MAX_FAILED_LOGINS; i++) {
      await assert.rejects(security.authenticate('CUSTOMER', 'sita@example.com', 'wrong'), UnauthorizedException);
    }
    await assert.rejects(security.authenticate('CUSTOMER', 'sita@example.com', 'right-password'), (error: any) => {
      assert.ok(error instanceof HttpException);
      assert.equal(error.getStatus(), 429);
      assert.equal((error.getResponse() as any).error, 'ACCOUNT_LOCKED');
      return true;
    });
    assert.ok(actions().includes('AUTH_LOGIN_BLOCKED'));
  });

  it('counts wrong passwords that arrive at the same moment, so a burst cannot get past the limit', async () => {
    const row = await addCustomer();
    await Promise.allSettled(Array.from({ length: MAX_FAILED_LOGINS }, () => security.authenticate('CUSTOMER', 'sita@example.com', 'wrong')));
    assert.ok((row.lockedUntil as Date | null)! > new Date());
  });

  it('starts counting again once an old lock has run out', async () => {
    const row = await addCustomer({ failedLogins: 0, lockedUntil: new Date(Date.now() - 1000) });
    await assert.rejects(security.authenticate('CUSTOMER', 'sita@example.com', 'wrong'), UnauthorizedException);
    assert.equal(row.failedLogins, 1);
    assert.equal(row.lockedUntil, null);
  });

  it('clears earlier failures after a good login', async () => {
    const row = await addCustomer();
    await assert.rejects(security.authenticate('CUSTOMER', 'sita@example.com', 'wrong'));
    assert.equal(row.failedLogins, 1);
    await security.authenticate('CUSTOMER', 'sita@example.com', 'right-password');
    assert.equal(row.failedLogins, 0);
  });

  it('only blocks unverified accounts when verification is required', async () => {
    await addCustomer({ emailVerified: false });
    assert.ok(await security.authenticate('CUSTOMER', 'sita@example.com', 'right-password'));

    process.env.REQUIRE_EMAIL_VERIFICATION = 'true';
    await assert.rejects(security.authenticate('CUSTOMER', 'sita@example.com', 'right-password'), (error: any) => {
      assert.ok(error instanceof ForbiddenException);
      assert.equal((error.getResponse() as any).error, 'EMAIL_NOT_VERIFIED');
      return true;
    });
  });
});

describe('emailed codes', () => {
  it('emails the code but stores a redacted copy', async () => {
    const row = await addCustomer();
    assert.equal(await security.sendCode('CUSTOMER', row, 'PASSWORD_RESET'), true);
    assert.equal(sent.length, 1);
    const code = sent[0].body.match(/\b\d{6}\b/)[0];
    assert.ok(sent[0].html.includes(code));
    assert.ok(!sent[0].storedBody.includes(code));
    assert.equal(sent[0].recipient, 'sita@example.com');
  });

  it('forgot-password gives the same answer for unknown and known accounts, and only mails the real one', async () => {
    await addCustomer();
    const unknown = await security.forgotPassword('CUSTOMER', 'nobody@example.com');
    const known = await security.forgotPassword('CUSTOMER', 'sita@example.com');
    await flush();
    assert.deepEqual(unknown, known);
    assert.equal(sent.length, 1);
    assert.equal(sent[0].recipient, 'sita@example.com');
  });

  it('does not email guest accounts', async () => {
    await addCustomer({ isGuest: true, email: 'guest-1@logicbit.local' });
    await security.forgotPassword('CUSTOMER', 'guest-1@logicbit.local');
    await flush();
    assert.equal(sent.length, 0);
  });

  it('confirms the email with the right code only', async () => {
    const row = await addCustomer({ emailVerified: false });
    await assert.rejects(security.verifyEmail('CUSTOMER', 'sita@example.com', '123456'), BadRequestException);
    const code = (await otp.issue('CUSTOMER', 'c1', 'EMAIL_VERIFY'))!;
    await security.verifyEmail('CUSTOMER', 'sita@example.com', code);
    assert.equal(row.emailVerified, true);
    assert.ok(actions().includes('AUTH_EMAIL_VERIFIED'));
  });

  it('resend-verification never reveals whether the account exists', async () => {
    await addCustomer({ emailVerified: false });
    const known = await security.resendVerification('CUSTOMER', 'sita@example.com');
    const unknown = await security.resendVerification('CUSTOMER', 'nobody@example.com');
    await flush();
    assert.deepEqual(known, unknown);
    assert.equal(sent.length, 1);
  });
});

describe('resetPassword', () => {
  it('sets the password, ends every session, clears the lock and confirms the email', async () => {
    const row = await addCustomer({ failedLogins: 3, lockedUntil: new Date(Date.now() + 60_000), emailVerified: false });
    const code = (await otp.issue('CUSTOMER', 'c1', 'PASSWORD_RESET'))!;
    await security.resetPassword('CUSTOMER', 'sita@example.com', code, 'brand-new-password');

    assert.equal(row.tokenVersion, 1);
    assert.equal(row.failedLogins, 0);
    assert.equal(row.lockedUntil, null);
    assert.equal(row.emailVerified, true);
    assert.ok(await security.authenticate('CUSTOMER', 'sita@example.com', 'brand-new-password'));
    await assert.rejects(security.authenticate('CUSTOMER', 'sita@example.com', 'right-password'), UnauthorizedException);
    assert.ok(actions().includes('AUTH_PASSWORD_RESET'));
  });

  it('refuses a wrong code and a reused code', async () => {
    await addCustomer();
    await assert.rejects(security.resetPassword('CUSTOMER', 'sita@example.com', '000000', 'brand-new-password'), BadRequestException);
    const code = (await otp.issue('CUSTOMER', 'c1', 'PASSWORD_RESET'))!;
    await security.resetPassword('CUSTOMER', 'sita@example.com', code, 'brand-new-password');
    await assert.rejects(security.resetPassword('CUSTOMER', 'sita@example.com', code, 'another-password'), BadRequestException);
  });

  it('does not accept an email-verification code for a password reset', async () => {
    await addCustomer();
    const code = (await otp.issue('CUSTOMER', 'c1', 'EMAIL_VERIFY'))!;
    await assert.rejects(security.resetPassword('CUSTOMER', 'sita@example.com', code, 'brand-new-password'), BadRequestException);
  });
});

describe('logoutAll', () => {
  it('bumps the token version so existing tokens stop working', async () => {
    const row = await addCustomer();
    await security.logoutAll('CUSTOMER', 'c1');
    assert.equal(row.tokenVersion, 1);
    assert.ok(actions().includes('AUTH_LOGOUT_ALL'));
  });
});
