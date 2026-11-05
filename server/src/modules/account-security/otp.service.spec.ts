import { beforeEach, describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { OtpService, MAX_ATTEMPTS, MAX_CODES_PER_DAY, RESEND_COOLDOWN_MS } from './otp.service';
import { fakeTable, fakeTransaction } from './fake-db';

process.env.OTP_SECRET = 'test-secret';

let table: ReturnType<typeof fakeTable>;
let otp: OtpService;
const t0 = new Date('2026-11-05T10:00:00Z');
const later = (ms: number) => new Date(t0.getTime() + ms);

beforeEach(() => {
  table = fakeTable([], { attempts: 0, consumedAt: null }); // the database's column defaults
  otp = new OtpService({ otpCode: table, $transaction: fakeTransaction } as any);
});

describe('OtpService.issue', () => {
  it('makes a six-digit code and stores only its hash', async () => {
    const code = await otp.issue('CUSTOMER', 'c1', 'EMAIL_VERIFY', t0);
    assert.match(code!, /^\d{6}$/);
    assert.equal(table.rows.length, 1);
    assert.notEqual(table.rows[0].codeHash, code);
    assert.ok(!JSON.stringify(table.rows).includes(code!));
  });

  it('does not send another code within the resend cooldown, then allows it', async () => {
    assert.ok(await otp.issue('CUSTOMER', 'c1', 'EMAIL_VERIFY', t0));
    assert.equal(await otp.issue('CUSTOMER', 'c1', 'EMAIL_VERIFY', later(RESEND_COOLDOWN_MS - 1000)), null);
    assert.ok(await otp.issue('CUSTOMER', 'c1', 'EMAIL_VERIFY', later(RESEND_COOLDOWN_MS + 1000)));
  });

  it('stops after the daily limit', async () => {
    for (let i = 0; i < MAX_CODES_PER_DAY; i++) {
      assert.ok(await otp.issue('CUSTOMER', 'c1', 'EMAIL_VERIFY', later(i * (RESEND_COOLDOWN_MS + 1000))));
    }
    assert.equal(await otp.issue('CUSTOMER', 'c1', 'EMAIL_VERIFY', later(MAX_CODES_PER_DAY * (RESEND_COOLDOWN_MS + 1000))), null);
  });

  it('makes an older unused code stop working when a new one is issued', async () => {
    const first = (await otp.issue('CUSTOMER', 'c1', 'PASSWORD_RESET', t0))!;
    const second = (await otp.issue('CUSTOMER', 'c1', 'PASSWORD_RESET', later(RESEND_COOLDOWN_MS + 1000)))!;
    const when = later(RESEND_COOLDOWN_MS + 2000);
    assert.equal(await otp.verify('CUSTOMER', 'c1', 'PASSWORD_RESET', first, when), false);
    assert.equal(await otp.verify('CUSTOMER', 'c1', 'PASSWORD_RESET', second, when), true);
  });
});

describe('OtpService.verify', () => {
  it('accepts the right code once only', async () => {
    const code = (await otp.issue('OWNER', 'u1', 'EMAIL_VERIFY', t0))!;
    assert.equal(await otp.verify('OWNER', 'u1', 'EMAIL_VERIFY', code, later(1000)), true);
    assert.equal(await otp.verify('OWNER', 'u1', 'EMAIL_VERIFY', code, later(2000)), false);
  });

  it('rejects an expired code', async () => {
    const code = (await otp.issue('OWNER', 'u1', 'EMAIL_VERIFY', t0))!;
    assert.equal(await otp.verify('OWNER', 'u1', 'EMAIL_VERIFY', code, later(11 * 60_000)), false);
  });

  it('does not accept a code for another account, purpose or account type', async () => {
    const code = (await otp.issue('CUSTOMER', 'c1', 'EMAIL_VERIFY', t0))!;
    assert.equal(await otp.verify('CUSTOMER', 'c2', 'EMAIL_VERIFY', code, later(1000)), false);
    assert.equal(await otp.verify('CUSTOMER', 'c1', 'PASSWORD_RESET', code, later(1000)), false);
    assert.equal(await otp.verify('OWNER', 'c1', 'EMAIL_VERIFY', code, later(1000)), false);
    assert.equal(await otp.verify('CUSTOMER', 'c1', 'EMAIL_VERIFY', code, later(1000)), true);
  });

  it('kills the code after too many wrong guesses, even if the right one is entered next', async () => {
    const code = (await otp.issue('CUSTOMER', 'c1', 'PASSWORD_RESET', t0))!;
    const wrong = code === '000000' ? '111111' : '000000';
    for (let i = 0; i < MAX_ATTEMPTS; i++) assert.equal(await otp.verify('CUSTOMER', 'c1', 'PASSWORD_RESET', wrong, later(1000)), false);
    assert.equal(await otp.verify('CUSTOMER', 'c1', 'PASSWORD_RESET', code, later(2000)), false);
  });
});
