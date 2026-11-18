import { createTransport } from 'nodemailer';

export interface MailMessage {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export interface MailSender {
  send(message: MailMessage): Promise<void>;
  /** Checks the SMTP settings are usable. Rejects with the reason when they are not. */
  verify?(): Promise<void>;
}

/**
 * Builds an SMTP sender from the environment, or returns null when SMTP_HOST is not set
 * (emails are then only logged, which is what local development wants).
 *
 * SMTP_HOST, SMTP_PORT (default 587), SMTP_USER, SMTP_PASS, SMTP_SECURE ("true" for port 465), SMTP_FROM.
 */
export function smtpSenderFromEnv(env: NodeJS.ProcessEnv = process.env): MailSender | null {
  if (!env.SMTP_HOST) return null;

  const transport = createTransport({
    host: env.SMTP_HOST,
    port: Number(env.SMTP_PORT) || 587,
    secure: env.SMTP_SECURE === 'true',
    auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS ?? '' } : undefined,
  });
  const from = env.SMTP_FROM || `${env.BRAND_NAME ?? 'LogicBit'} <no-reply@logicbit.local>`;

  return {
    async send(message) {
      await transport.sendMail({ from, ...message });
    },
    async verify() {
      await transport.verify();
    },
  };
}
