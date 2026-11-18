import { Injectable } from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { AccountSecurityService, RequestCtx } from '../account-security/account-security.service';
import { CustomerAuthService } from '../customer-auth/customer-auth.service';

// Codes the website's /auth/callback page knows how to explain to the customer.
export type SocialErrorCode =
  | 'provider_not_configured'
  | 'access_denied'
  | 'invalid_state'
  | 'no_email'
  | 'email_unverified'
  | 'account_disabled'
  | 'login_failed';

export class SocialAuthError extends Error {
  constructor(
    public readonly code: SocialErrorCode,
    message?: string,
  ) {
    super(message ?? code);
  }
}

export interface SocialProfile {
  providerUserId: string;
  name: string;
  email: string | null;
  emailVerified: boolean;
}

const HANDOFF_TTL_MS = 60_000;
export const LOCALES = ['en', 'ja'];

const hashCode = (code: string) => createHash('sha256').update(code).digest('hex');

/**
 * "Continue with Google" for customers, using the standard authorization-code flow with plain fetch.
 * Flow: browser -> GET google -> Google -> GET google/callback -> we find or create the customer and send the
 * browser to the website with a single-use code in the URL fragment -> the website POSTs the code to google/exchange
 * and receives the same tokens a password login returns. No token ever travels in a URL.
 */
@Injectable()
export class SocialAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly security: AccountSecurityService,
    private readonly customerAuth: CustomerAuthService,
  ) {}

  private get backendUrl() {
    return (process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 3005}`).replace(/\/$/, '');
  }

  private get frontendUrl() {
    return (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
  }

  isConfigured() {
    return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  }

  /** The address that must be registered as an authorised redirect URI in the Google Cloud console. */
  get redirectUri() {
    return `${this.backendUrl}/api/v1/customer-auth/google/callback`;
  }

  get cookieSecure() {
    return this.backendUrl.startsWith('https://');
  }

  /** Where the browser goes at the end: the callback page, carrying either a code or an error in the fragment. */
  frontendCallbackUrl(locale: string, result: { code: string } | { error: SocialErrorCode }) {
    const safeLocale = LOCALES.includes(locale) ? locale : 'en';
    const fragment = 'error' in result ? `error=${result.error}` : `code=${result.code}`;
    return `${this.frontendUrl}/${safeLocale}/auth/callback#${fragment}`;
  }

  buildAuthUrl(state: string) {
    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      state,
      prompt: 'select_account',
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  }

  private async getJson(url: string, init?: RequestInit) {
    const response = await fetch(url, init);
    const body: any = await response.json().catch(() => ({}));
    if (!response.ok) throw new SocialAuthError('login_failed', body?.error_description ?? body?.error ?? `HTTP ${response.status}`);
    return body;
  }

  async fetchProfile(code: string): Promise<SocialProfile> {
    const token = await this.getJson('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: this.redirectUri,
        grant_type: 'authorization_code',
      }),
    });
    const info = await this.getJson('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: { Authorization: `Bearer ${token.access_token}` },
    });
    return {
      providerUserId: String(info.sub),
      name: info.name || info.email || 'Google user',
      email: info.email ?? null,
      emailVerified: info.email_verified === true || info.email_verified === 'true',
    };
  }

  /** Finds the customer for this Google identity, links it to an existing account with the same verified email, or creates one. */
  async findOrCreateCustomer(profile: SocialProfile) {
    const provider = 'google';

    const linked = await this.prisma.socialAccount.findUnique({
      where: { provider_providerUserId: { provider, providerUserId: profile.providerUserId } },
      include: { customer: true },
    });
    if (linked) return linked.customer;

    // First time with Google: a verified email is needed to match or create an account.
    if (!profile.email) throw new SocialAuthError('no_email');
    if (!profile.emailVerified) throw new SocialAuthError('email_unverified');

    const email = this.security.normalizeEmail(profile.email);
    const existing = await this.security.findByEmail('CUSTOMER', email);

    if (existing) {
      await this.prisma.socialAccount.create({ data: { provider, providerUserId: profile.providerUserId, customerId: existing.id } });

      // Google has just proven this email is theirs. If the local account was never verified, someone else may have
      // registered it first with a password only they know. Verify it, remove that password and sign out any session
      // they opened, so the real owner of the email is the only person left with access.
      if (!existing.emailVerified) {
        return this.prisma.customer.update({
          where: { id: existing.id },
          data: { emailVerified: true, passwordHash: null, tokenVersion: { increment: 1 }, failedLogins: 0, lockedUntil: null },
        });
      }
      return existing;
    }

    // A brand-new customer with no password. They can set one later with "Forgot password".
    return this.prisma.customer.create({
      data: {
        name: profile.name,
        email,
        isGuest: false,
        emailVerified: true,
        socialAccounts: { create: { provider, providerUserId: profile.providerUserId } },
      },
    });
  }

  /** From Google's code to a single-use code for the website. */
  async handleCallback(googleCode: string, ctx: RequestCtx = {}): Promise<string> {
    const profile = await this.fetchProfile(googleCode);
    const customer = await this.findOrCreateCustomer(profile);
    if (!customer.isActive) throw new SocialAuthError('account_disabled');

    this.security.audit('CUSTOMER', customer, 'AUTH_SOCIAL_LOGIN', 'Logged in with Google', ctx);

    const handoff = randomBytes(32).toString('hex');
    await this.prisma.socialLoginCode.create({
      data: { codeHash: hashCode(handoff), customerId: customer.id, expiresAt: new Date(Date.now() + HANDOFF_TTL_MS) },
    });
    return handoff;
  }

  /** Swaps the single-use code for a normal login response. Works once, within a minute. */
  async exchange(handoff: string) {
    const expired = new SocialAuthError('invalid_state', 'This sign-in link has expired. Please try again.');
    const row = await this.prisma.socialLoginCode.findUnique({ where: { codeHash: hashCode(handoff) } });
    if (!row || row.usedAt || row.expiresAt < new Date()) throw expired;

    // Mark it used atomically, so two requests cannot both redeem it.
    const used = await this.prisma.socialLoginCode.updateMany({ where: { id: row.id, usedAt: null }, data: { usedAt: new Date() } });
    if (used.count !== 1) throw expired;

    const customer = await this.prisma.customer.findUnique({ where: { id: row.customerId } });
    if (!customer || !customer.isActive) throw new SocialAuthError('account_disabled');
    return this.customerAuth.startSession(customer);
  }
}
