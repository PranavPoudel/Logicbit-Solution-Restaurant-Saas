import { Injectable } from '@nestjs/common';
import { AccountType, OtpPurpose } from '@prisma/client';
import { createHmac, randomInt, timingSafeEqual } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { OTP_TTL_MINUTES } from './otp-email';

export const MAX_ATTEMPTS = 5;
export const RESEND_COOLDOWN_MS = 60_000;
export const MAX_CODES_PER_DAY = 5;

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * One-time emailed codes. Only an HMAC of the code is stored (keyed with a server secret and tied to
 * the account and purpose), so a leaked table cannot be reversed and a code cannot be used for something else.
 */
@Injectable()
export class OtpService {
  constructor(private readonly prisma: PrismaService) {}

  private secret() {
    const secret = process.env.OTP_SECRET || process.env.JWT_ACCESS_SECRET;
    if (!secret) throw new Error('OTP_SECRET (or JWT_ACCESS_SECRET) must be set');
    return secret;
  }

  hash(type: AccountType, accountId: string, purpose: OtpPurpose, code: string) {
    return createHmac('sha256', this.secret()).update(`${type}:${accountId}:${purpose}:${code}`).digest('hex');
  }

  /**
   * Makes a fresh code and returns it so the caller can email it. Older unused codes stop working.
   * Returns null (nothing to send) when this account asked less than a minute ago or too many times today,
   * which the callers hide from the user so account existence is not revealed.
   */
  async issue(type: AccountType, accountId: string, purpose: OtpPurpose, now = new Date()): Promise<string | null> {
    const recent = await this.prisma.otpCode.findMany({
      where: { accountType: type, accountId, purpose, createdAt: { gte: new Date(now.getTime() - DAY_MS) } },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    });
    if (recent.length >= MAX_CODES_PER_DAY) return null;
    if (recent[0] && now.getTime() - recent[0].createdAt.getTime() < RESEND_COOLDOWN_MS) return null;

    const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
    await this.prisma.$transaction([
      this.prisma.otpCode.updateMany({ where: { accountType: type, accountId, purpose, consumedAt: null }, data: { consumedAt: now } }),
      this.prisma.otpCode.create({
        data: {
          accountType: type,
          accountId,
          purpose,
          codeHash: this.hash(type, accountId, purpose, code),
          createdAt: now, // from the same clock as the cooldown and daily-limit checks above
          expiresAt: new Date(now.getTime() + OTP_TTL_MINUTES * 60_000),
        },
      }),
    ]);
    return code;
  }

  /** True once, for the right unexpired code. Wrong guesses are counted, and the code dies after MAX_ATTEMPTS. */
  async verify(type: AccountType, accountId: string, purpose: OtpPurpose, code: string, now = new Date()): Promise<boolean> {
    const active = await this.prisma.otpCode.findFirst({
      where: { accountType: type, accountId, purpose, consumedAt: null, expiresAt: { gt: now } },
      orderBy: { createdAt: 'desc' },
    });
    if (!active) return false;

    // Count the attempt first and atomically, so a burst of parallel guesses cannot exceed the limit.
    const counted = await this.prisma.otpCode.updateMany({
      where: { id: active.id, consumedAt: null, attempts: { lt: MAX_ATTEMPTS } },
      data: { attempts: { increment: 1 } },
    });
    if (counted.count !== 1) return false;

    const expected = Buffer.from(active.codeHash, 'hex');
    const given = Buffer.from(this.hash(type, accountId, purpose, code.trim()), 'hex');
    if (expected.length !== given.length || !timingSafeEqual(new Uint8Array(expected), new Uint8Array(given))) return false;

    const used = await this.prisma.otpCode.updateMany({ where: { id: active.id, consumedAt: null }, data: { consumedAt: now } });
    return used.count === 1;
  }
}
