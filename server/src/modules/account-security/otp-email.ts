import { OtpPurpose } from '@prisma/client';

export const OTP_TTL_MINUTES = 10;

const escapeHtml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const COPY: Record<OtpPurpose, { subject: string; intro: string }> = {
  EMAIL_VERIFY: { subject: 'Confirm your email address', intro: 'Use this code to confirm your email address:' },
  PASSWORD_RESET: { subject: 'Reset your password', intro: 'Use this code to choose a new password:' },
};

export function buildOtpEmail(o: { brand: string; name: string; code: string; purpose: OtpPurpose }) {
  const { subject, intro } = COPY[o.purpose];
  const ignore = "If you didn't ask for this, you can ignore this email. Nobody can use the code without your email account.";
  const text = `Hi ${o.name},\n\n${intro}\n\n${o.code}\n\nIt expires in ${OTP_TTL_MINUTES} minutes. ${ignore}\n\n${o.brand}`;
  const html =
    `<p>Hi ${escapeHtml(o.name)},</p><p>${intro}</p>` +
    `<p style="font-size:28px;font-weight:700;letter-spacing:6px">${o.code}</p>` +
    `<p>It expires in ${OTP_TTL_MINUTES} minutes. ${ignore}</p><p>${escapeHtml(o.brand)}</p>`;
  // What gets saved in the notification table and logs: the code itself is never stored in plain text.
  const redactedText = `${subject} (a ${o.code.length}-digit code was emailed)`;
  return { subject: `${o.brand}: ${subject}`, text, html, redactedText };
}
