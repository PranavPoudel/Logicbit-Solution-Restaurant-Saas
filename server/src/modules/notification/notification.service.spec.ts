import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { NotificationService } from './notification.service';
import { MailMessage, smtpSenderFromEnv } from './mail.transport';

function setup(mailer: { send(m: MailMessage): Promise<void> } | null) {
  const updates: any[] = [];
  const prisma = {
    notification: {
      create: async () => ({ id: 'n1' }),
      update: async ({ data }: any) => {
        updates.push(data);
        return data;
      },
    },
  };
  const service = new NotificationService(prisma as any);
  service.mailer = mailer;
  return { service, updates };
}

const email = { channel: 'EMAIL' as const, recipient: 'a@b.test', subject: 'Hello', body: 'plain', html: '<b>html</b>' };

describe('NotificationService.send', () => {
  it('delivers an email through SMTP and records it as sent', async () => {
    const sent: MailMessage[] = [];
    const { service, updates } = setup({ send: async (m) => void sent.push(m) });
    await service.send(email);
    assert.deepEqual(sent, [{ to: 'a@b.test', subject: 'Hello', text: 'plain', html: '<b>html</b>' }]);
    assert.equal(updates[0].status, 'SENT');
  });

  it('records a failed delivery as failed instead of sent', async () => {
    const { service, updates } = setup({ send: async () => { throw new Error('connection refused'); } });
    await service.send(email);
    assert.equal(updates[0].status, 'FAILED');
  });

  it('only logs an email when SMTP is not configured', async () => {
    const { service, updates } = setup(null);
    await service.send(email);
    assert.equal(updates[0].status, 'SENT');
  });

  it('does not send SMS through the mail server', async () => {
    let called = false;
    const { service, updates } = setup({ send: async () => void (called = true) });
    await service.send({ channel: 'SMS', recipient: '+81000', body: 'hi' });
    assert.equal(called, false);
    assert.equal(updates[0].status, 'SENT');
  });
});

describe('smtpSenderFromEnv', () => {
  it('is off without SMTP_HOST', () => {
    assert.equal(smtpSenderFromEnv({}), null);
  });

  it('is on once SMTP_HOST is set', () => {
    assert.ok(smtpSenderFromEnv({ SMTP_HOST: 'sandbox.smtp.mailtrap.io', SMTP_PORT: '2525', SMTP_USER: 'u', SMTP_PASS: 'p' }));
  });
});
