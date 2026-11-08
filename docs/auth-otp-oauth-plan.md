# Auth upgrade: email codes (OTP), account hardening, Google login

Status: **built and tested on branch `customer-redesign`, not committed yet.** Covers **customers and owners**.
Out of scope this round: platform-admin staff login, delivery-rider login, Facebook, Apple, SMS codes, passwordless OTP login.

## What it does

| # | Feature | How |
|---|---|---|
| 1 | Email verification by 6-digit code | emailed on sign-up; "send a new code" has a 60-second cooldown |
| 2 | Forgot / reset password by 6-digit code | same code mechanism, purpose `PASSWORD_RESET` |
| 3 | Login lockout | 5 wrong passwords lock the account for 10 minutes, checked before the password |
| 4 | Sign out everywhere | `tokenVersion` on the account; a password reset or `logout-all` bumps it; access tokens **and owner refresh tokens** are checked |
| 5 | Auth audit trail | written to the existing `ActivityLog` (`AUTH_*` actions, with IP and browser) |
| 6 | Block unverified logins | only when `REQUIRE_EMAIL_VERIFICATION=true` (off by default) |
| 7 | Timing protection | a dummy bcrypt compare (10 rounds) when the email does not exist |
| 8 | Google login (customers) | server flow ported from AutoHub; single-use exchange code instead of a cookie or a token in the URL |
| 9 | Mail foundation | SMTP via `nodemailer`; SMTP check at startup (logged, never blocks boot) |
| 10 | `TRUST_PROXY` | so per-IP rate limits see the real client address behind Render |

## Decisions

- **Codes:** `OtpCode` stores an HMAC-SHA256 of the code (server secret), tied to account type, account id and purpose; constant-time compare; 10-minute expiry; 5 attempts per code (counted atomically); one active code per account and purpose; max 5 codes per account per day.
- **No plaintext codes at rest:** auth emails store a redacted body in `Notification`. The code is only logged in development and only when SMTP is off.
- **Forgot password / resend** answer identically whether or not the account exists, and send in the background.
- **Reset success** bumps `tokenVersion`, clears the lockout and marks the email verified.
- **Existing accounts:** `emailVerified` defaults to `true` in the schema, so every existing account, seed account, invited staff member and guest counts as verified. Only the two self sign-up paths set it to `false`. Old tokens with no `tv` claim are accepted while the account is at version 0.
- **Emails are lower-cased** and matched case-insensitively.
- **Google:** state cookie on the API (`/api/v1/customer-auth` path, `secure` on https). The callback redirects to `FRONTEND_URL/<locale>/auth/callback#code=...`; the page POSTs the code (valid 60 seconds, once) to get tokens. Takeover rule from AutoHub: if a local account with the same email was never verified, Google verifying it removes its password and signs out its sessions.

## Endpoints

Customer `/api/v1/customer-auth` and owner `/api/v1/auth`: `POST verify-email`, `resend-verification`, `forgot-password`, `reset-password`, `logout-all` (needs login).
Customer only: `GET google`, `GET google/callback`, `POST google/exchange`.
Errors carry a code in `error`: `EMAIL_NOT_VERIFIED` (403), `ACCOUNT_LOCKED` (429).

## New settings (`server/.env.example`)

`REQUIRE_EMAIL_VERIFICATION`, `OTP_SECRET` (falls back to `JWT_ACCESS_SECRET`), `TRUST_PROXY` (1 on Render), `BACKEND_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, plus `SMTP_HOST/PORT/USER/PASS/SECURE/FROM`.
Google needs an OAuth client in Google Cloud Console with this redirect URI: `<BACKEND_URL>/api/v1/customer-auth/google/callback`.

## Rolling it out

1. Run `npx prisma db push` (adds columns and 3 tables, nothing is removed).
2. Set `SMTP_*` and `OTP_SECRET` on the server (Render).
3. Set `TRUST_PROXY=1` on Render.
4. Create the Google OAuth client, set `BACKEND_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`.
5. When ready, set `REQUIRE_EMAIL_VERIFICATION=true`. The verify pages exist for customers and owners, so it is safe to turn on.

## Work split (50/50)

**Shared groundwork, lands first** (both halves depend on it):
`server/prisma/schema.prisma` (new columns, `OtpCode`, `SocialAccount`, `SocialLoginCode`), `server/src/modules/account-security/*`, `server/src/modules/notification/*`, `server/src/main.ts`, `server/.env.example`, `server/package.json` and lock.

**Half A: codes and hardening**
- Server: `customer-auth/*`, `auth/*` (owner), both JWT strategies and their tests.
- Client, customers: `(auth)/verify-email`, `forgot-password`, `reset-password`, changes to `login` and `signup` pages (forgot link, redirect to verify), `(auth)/layout.tsx`, `AuthShell` heading and `AuthNotice`.
- Client, owners: `app/owner/verify-email`, `forgot-password`, `reset-password`, `login` page, `register` page redirect, `components/auth/owner-auth-card.tsx`.
- Shared helpers: `lib/utils/auth-error.ts`, `hooks/use-cooldown.ts`, `lib/validation/auth-schemas.ts`, `lib/api/owner-auth.ts`.

**Half B: Google login**
- Server: `social-auth/*` (controller, service, module, tests); `SocialAuthModule` in `app.module.ts`; `startSession()` in `customer-auth.service.ts`.
- Client: `app/[locale]/(customer)/auth/callback/page.tsx`, `lib/utils/google-login.ts`, `GoogleButton` and `OrDivider` in `AuthShell`, the Google lines in `login` and `signup`, `customerGoogleExchange` and `googleLoginUrl` in `lib/api/customer-auth.ts`.
- Setup by hand: the Google Cloud OAuth client.

**Files both halves touch (merge by hand):** `schema.prisma`, `messages/en.json` and `ja.json` (`auth.*` keys), `auth-shell.tsx`, `lib/api/customer-auth.ts`, the customer `login` and `signup` pages, `customer-auth.service.ts`.

## Handing over as a zip

Leave out `server/.env` (holds a real SMTP password), `client/.env.local`, `node_modules`, `dist`, `.next`.

## Test status

- Server: 155 tests pass (42 new, covering codes, lockout, reset, session ending, Google linking and the one-time code). `tsc` clean.
- Client: `tsc` clean, 29 tests pass, changed files lint-clean.
- Live against the dev database (SMTP off, codes read from the log): register, verify, wrong and reused codes, forgot and reset, old session rejected, new password, lockout after 5, `logout-all`, owner flows, existing accounts still log in (24 checks). Customer and owner pages checked in a browser in English and Japanese. The one-time Google code was exercised through the real callback page.
- One real email (the SMTP test) was delivered to the Mailtrap sandbox. The code emails themselves have not yet been viewed in Mailtrap.
- **Not tested:** the actual round trip to Google, because no Google OAuth client exists yet.

## Known gaps

- The owner register page already showed an error after a successful sign-up (the server never returned tokens); it now goes to the verify page instead.
- The customer sign-up form still accepts 6-character passwords while the server requires 8.
- The owner register page still has an old `catch (err: any)` lint error.
