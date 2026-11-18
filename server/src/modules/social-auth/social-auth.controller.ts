import { BadRequestException, Body, Controller, Get, HttpCode, HttpStatus, Post, Query, Req, Res } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { IsString, Length } from 'class-validator';
import { randomBytes, timingSafeEqual } from 'crypto';
import { LOCALES, SocialAuthError, SocialAuthService } from './social-auth.service';

const STATE_COOKIE = 'lb_oauth_state';
const COOKIE_PATH = '/api/v1/customer-auth'; // sent to the callback route on the API, never to the website

class ExchangeDto {
  @IsString()
  @Length(64, 64)
  code: string;
}

function readCookie(header: string | undefined, name: string) {
  if (!header) return undefined;
  for (const part of header.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return decodeURIComponent(rest.join('='));
  }
  return undefined;
}

function safeEqual(a: string, b: string) {
  const left = new Uint8Array(Buffer.from(a));
  const right = new Uint8Array(Buffer.from(b));
  return left.length === right.length && timingSafeEqual(left, right);
}

/** The first two routes are opened by navigating the browser to them (not fetch), so they answer with redirects. */
@ApiTags('Customer Auth (Public)')
@Controller('api/v1/customer-auth')
export class SocialAuthController {
  constructor(private readonly social: SocialAuthService) {}

  @Get('google')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  start(@Query('locale') locale: string, @Res() res: Response) {
    const safeLocale = LOCALES.includes(locale) ? locale : 'en';
    if (!this.social.isConfigured()) return res.redirect(this.social.frontendCallbackUrl(safeLocale, { error: 'provider_not_configured' }));

    // `state` ties the callback to this browser: Google echoes it back and it must match this httpOnly cookie,
    // which stops someone else's login being forced on the user. The locale rides along so we can send them back to it.
    const state = `${randomBytes(24).toString('hex')}:${safeLocale}`;
    res.cookie(STATE_COOKIE, state, {
      httpOnly: true,
      sameSite: 'lax',
      secure: this.social.cookieSecure,
      maxAge: 10 * 60 * 1000,
      path: COOKIE_PATH,
    });
    return res.redirect(this.social.buildAuthUrl(state));
  }

  @Get('google/callback')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  async callback(@Query() query: Record<string, string>, @Req() req: Request, @Res() res: Response) {
    const expected = readCookie(req.headers.cookie, STATE_COOKIE);
    res.clearCookie(STATE_COOKIE, { path: COOKIE_PATH });
    const locale = (expected?.split(':')[1] ?? 'en') || 'en';

    if (query.error) return res.redirect(this.social.frontendCallbackUrl(locale, { error: 'access_denied' }));
    if (!query.code || !query.state || !expected || !safeEqual(query.state, expected)) {
      return res.redirect(this.social.frontendCallbackUrl(locale, { error: 'invalid_state' }));
    }

    try {
      const code = await this.social.handleCallback(query.code, { ip: req.ip, userAgent: req.headers['user-agent'] });
      return res.redirect(this.social.frontendCallbackUrl(locale, { code }));
    } catch (error) {
      const errorCode = error instanceof SocialAuthError ? error.code : 'login_failed';
      console.error('[auth] Google login failed:', (error as Error).message);
      return res.redirect(this.social.frontendCallbackUrl(locale, { error: errorCode }));
    }
  }

  @Post('google/exchange')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async exchange(@Body() dto: ExchangeDto) {
    try {
      return await this.social.exchange(dto.code);
    } catch (error) {
      if (error instanceof SocialAuthError) throw new BadRequestException({ message: error.message, error: error.code });
      throw error;
    }
  }
}
