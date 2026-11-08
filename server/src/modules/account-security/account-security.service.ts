import { BadRequestException, ForbiddenException, HttpException, HttpStatus, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { AccountType, OtpPurpose } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { NotificationService } from '../notification/notification.service';
import { OtpService } from './otp.service';
import { buildOtpEmail } from './otp-email';
import { checkPassword, hashPassword } from './passwords';
import { isLocked, lockExpiry, MAX_FAILED_LOGINS } from './login-lock';

export interface RequestCtx {
  ip?: string;
  userAgent?: string;
}

interface AccountRow {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  passwordHash: string | null;
  emailVerified: boolean;
  tokenVersion: number;
  failedLogins: number;
  lockedUntil: Date | null;
  tenantId?: string;
  isGuest?: boolean;
}

const SENT_NOTICE = 'If that account exists, we have emailed a code to it.';

/**
 * Everything about keeping customer and owner accounts safe, in one place: login protection (lockout, timing),
 * emailed codes (verify email, reset password), signing out everywhere, and the audit trail.
 * Customers and owners live in different tables, so the table is picked from the account type.
 */
@Injectable()
export class AccountSecurityService {
  private readonly logger = new Logger(AccountSecurityService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly otp: OtpService,
    private readonly notifications: NotificationService,
    private readonly activity: ActivityLogService,
  ) {}

  /** When true, an account must confirm its email before it can log in. Off by default. */
  get requireVerification() {
    return process.env.REQUIRE_EMAIL_VERIFICATION === 'true';
  }

  normalizeEmail(email: string) {
    return email.trim().toLowerCase();
  }

  private table(type: AccountType): any {
    return type === 'CUSTOMER' ? this.prisma.customer : this.prisma.user;
  }

  findByEmail(type: AccountType, email: string, include?: Record<string, unknown>): Promise<any> {
    return this.table(type).findFirst({ where: { email: { equals: this.normalizeEmail(email), mode: 'insensitive' } }, include });
  }

  /** Best-effort audit entry (ActivityLog never throws). */
  audit(type: AccountType, account: { id: string; tenantId?: string } | null, action: string, description: string, ctx: RequestCtx = {}) {
    void this.activity.log({
      tenantId: account?.tenantId,
      actorType: type,
      actorId: account?.id,
      action,
      description,
      metadata: { ip: ctx.ip, userAgent: ctx.userAgent },
    });
  }

  /**
   * Checks an email and password and returns the account, or throws. Handles the lockout, equal timing for
   * unknown emails, the optional "must verify email" rule and the audit entries.
   */
  async authenticate(type: AccountType, email: string, password: string, ctx: RequestCtx = {}, include?: Record<string, unknown>) {
    const account: (AccountRow & Record<string, any>) | null = await this.findByEmail(type, email, include);

    if (account && isLocked(account)) {
      this.audit(type, account, 'AUTH_LOGIN_BLOCKED', 'Login refused: account temporarily locked', ctx);
      throw new HttpException(
        { message: 'Too many failed attempts. Please try again in a few minutes.', error: 'ACCOUNT_LOCKED' },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const passwordOk = await checkPassword(account?.passwordHash, password);
    if (!account || !account.isActive || !passwordOk) {
      if (account && account.isActive) {
        await this.recordFailedLogin(type, account);
      }
      this.audit(type, account, 'AUTH_LOGIN_FAILED', 'Login failed: wrong email or password', ctx);
      throw new UnauthorizedException('Invalid credentials');
    }

    if (this.requireVerification && !account.emailVerified) {
      this.audit(type, account, 'AUTH_LOGIN_UNVERIFIED', 'Login refused: email not verified', ctx);
      throw new ForbiddenException({ message: 'Please confirm your email address first.', error: 'EMAIL_NOT_VERIFIED' });
    }

    if (account.failedLogins > 0 || account.lockedUntil) {
      await this.table(type).update({ where: { id: account.id }, data: { failedLogins: 0, lockedUntil: null } });
    }
    this.audit(type, account, 'AUTH_LOGIN_SUCCESS', 'Logged in', ctx);
    return account;
  }

  /**
   * Counts one wrong password with an atomic increment, so a burst of parallel guesses cannot undercount and
   * slip past the limit. The fifth wrong one locks the account. A lock that has run out starts the count again.
   */
  private async recordFailedLogin(type: AccountType, account: AccountRow) {
    const table = this.table(type);
    const now = new Date();
    if (account.lockedUntil && account.lockedUntil <= now) {
      await table.updateMany({ where: { id: account.id, lockedUntil: { lte: now } }, data: { failedLogins: 0, lockedUntil: null } });
    }
    const { failedLogins } = await table.update({ where: { id: account.id }, data: { failedLogins: { increment: 1 } }, select: { failedLogins: true } });
    if (failedLogins >= MAX_FAILED_LOGINS) {
      await table.update({ where: { id: account.id }, data: { failedLogins: 0, lockedUntil: lockExpiry(now) } });
    }
  }

  /** Emails a fresh code. Returns false when nothing was sent (asked too recently or too often). */
  async sendCode(type: AccountType, account: { id: string; name: string; email: string; tenantId?: string }, purpose: OtpPurpose) {
    const code = await this.otp.issue(type, account.id, purpose);
    if (!code) return false;

    const mail = buildOtpEmail({ brand: process.env.BRAND_NAME ?? 'LogicBit', name: account.name, code, purpose });
    await this.notifications.send({
      tenantId: account.tenantId,
      customerId: type === 'CUSTOMER' ? account.id : undefined,
      channel: 'EMAIL',
      recipient: account.email,
      subject: mail.subject,
      body: mail.text,
      html: mail.html,
      storedBody: mail.redactedText,
    });
    // Without an SMTP server there is nowhere to read the code, so show it while developing (never in production).
    if (!this.notifications.mailer && process.env.NODE_ENV !== 'production') {
      this.logger.warn(`[dev only] ${purpose} code for ${account.email}: ${code}`);
    }
    return true;
  }

  /** Sends without making the request wait, so response time does not reveal whether the account exists. */
  sendCodeInBackground(type: AccountType, account: { id: string; name: string; email: string; tenantId?: string }, purpose: OtpPurpose) {
    void this.sendCode(type, account, purpose).catch((error) => this.logger.error(`Could not send ${purpose} code`, error as Error));
  }

  async verifyEmail(type: AccountType, email: string, code: string, ctx: RequestCtx = {}) {
    const account = await this.findByEmail(type, email);
    const ok = account ? await this.otp.verify(type, account.id, 'EMAIL_VERIFY', code) : false;
    if (!account || !ok) throw new BadRequestException('That code is wrong or has expired.');

    await this.table(type).update({ where: { id: account.id }, data: { emailVerified: true } });
    this.audit(type, account, 'AUTH_EMAIL_VERIFIED', 'Email address confirmed', ctx);
    return { success: true, message: 'Email confirmed' };
  }

  async resendVerification(type: AccountType, email: string, ctx: RequestCtx = {}) {
    const account = await this.findByEmail(type, email);
    if (account && account.isActive && !account.emailVerified) {
      this.sendCodeInBackground(type, account, 'EMAIL_VERIFY');
      this.audit(type, account, 'AUTH_VERIFICATION_SENT', 'Verification code requested', ctx);
    }
    return { success: true, message: SENT_NOTICE };
  }

  async forgotPassword(type: AccountType, email: string, ctx: RequestCtx = {}) {
    const account = await this.findByEmail(type, email);
    if (account && account.isActive && !account.isGuest) {
      this.sendCodeInBackground(type, account, 'PASSWORD_RESET');
      this.audit(type, account, 'AUTH_PASSWORD_RESET_REQUESTED', 'Password reset code requested', ctx);
    }
    return { success: true, message: SENT_NOTICE };
  }

  /** Sets a new password after a valid code, ends every session, clears any lockout and confirms the email. */
  async resetPassword(type: AccountType, email: string, code: string, newPassword: string, ctx: RequestCtx = {}) {
    const account = await this.findByEmail(type, email);
    const ok = account && account.isActive ? await this.otp.verify(type, account.id, 'PASSWORD_RESET', code) : false;
    if (!account || !ok) throw new BadRequestException('That code is wrong or has expired.');

    await this.table(type).update({
      where: { id: account.id },
      data: {
        passwordHash: await hashPassword(newPassword),
        tokenVersion: { increment: 1 },
        failedLogins: 0,
        lockedUntil: null,
        emailVerified: true,
      },
    });
    this.audit(type, account, 'AUTH_PASSWORD_RESET', 'Password reset with a code; all sessions ended', ctx);
    return { success: true, message: 'Password updated. Please log in with it.' };
  }

  async logoutAll(type: AccountType, accountId: string, ctx: RequestCtx = {}) {
    const account = await this.table(type).update({ where: { id: accountId }, data: { tokenVersion: { increment: 1 } } });
    this.audit(type, account, 'AUTH_LOGOUT_ALL', 'Signed out of every device', ctx);
    return { success: true, message: 'Signed out of every device' };
  }
}
