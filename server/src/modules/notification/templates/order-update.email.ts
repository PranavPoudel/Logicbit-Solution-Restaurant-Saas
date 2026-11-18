import { BuiltEmail, escapeHtml } from './order-confirmation.email';

export type OrderUpdateKind = 'PICKED_UP' | 'OUT_FOR_DELIVERY' | 'DELIVERED';

export interface OrderUpdateData {
  kind: OrderUpdateKind;
  brandName: string;
  supportEmail?: string;
  customerName: string;
  orderNumber: string;
  orderType: 'DELIVERY' | 'PICKUP' | 'DINE_IN';
  restaurantName: string;
  /** Link to the order page where the customer can follow it. */
  orderUrl?: string;
  driver?: { name?: string | null; phone?: string | null; vehicle?: string | null; trackingUrl?: string | null };
}

interface Copy {
  subject: string;
  heading: string;
  message: string;
}

function copyFor(data: OrderUpdateData): Copy {
  const { orderNumber, restaurantName, brandName } = data;
  switch (data.kind) {
    case 'PICKED_UP':
      return {
        subject: `Your driver has picked up order ${orderNumber}`,
        heading: 'Your driver has picked up your order',
        message: `Your order from ${restaurantName} is with the driver and on its way to you.`,
      };
    case 'OUT_FOR_DELIVERY':
      return {
        subject: `Order ${orderNumber} is on its way`,
        heading: 'Your order is on its way',
        message: `Your order from ${restaurantName} is out for delivery.`,
      };
    case 'DELIVERED':
      return {
        subject: `Thank you for ordering with ${brandName}`,
        heading: data.orderType === 'DELIVERY' ? 'Your order has arrived' : 'Thank you for your order',
        message: `Order ${orderNumber} from ${restaurantName} is complete. Thank you for using ${brandName}. We hope you enjoy your meal and see you again soon.`,
      };
  }
}

function driverLines(driver: NonNullable<OrderUpdateData['driver']>): [string, string][] {
  const lines: [string, string][] = [];
  if (driver.name) lines.push(['Driver', driver.name]);
  if (driver.vehicle) lines.push(['Vehicle', driver.vehicle]);
  if (driver.phone) lines.push(['Driver phone', driver.phone]);
  return lines;
}

export function buildOrderUpdateEmail(data: OrderUpdateData): BuiltEmail {
  const { subject, heading, message } = copyFor(data);
  const showDriver = data.kind === 'PICKED_UP' || data.kind === 'OUT_FOR_DELIVERY';
  const details = showDriver && data.driver ? driverLines(data.driver) : [];
  const trackingUrl = showDriver ? data.driver?.trackingUrl : undefined;
  const links: [string, string][] = [];
  if (trackingUrl) links.push(['Track your delivery', trackingUrl]);
  if (data.orderUrl) links.push(['View your order', data.orderUrl]);

  const detailRows = details
    .map(([label, value]) => `<tr><td style="padding:3px 12px 3px 0;font-size:14px;color:#6b7280;">${escapeHtml(label)}</td><td style="padding:3px 0;font-size:14px;color:#111827;">${escapeHtml(value)}</td></tr>`)
    .join('\n');
  const linkParagraphs = links
    .map(([label, url]) => `<p style="margin:12px 0 0;"><a href="${escapeHtml(url)}" style="font-size:14px;font-weight:700;color:#2563eb;">${escapeHtml(label)}</a></p>`)
    .join('\n');
  const supportLine = data.supportEmail
    ? `<p style="font-size:14px;color:#374151;">Questions about your order? Contact <a href="mailto:${escapeHtml(data.supportEmail)}" style="color:#2563eb;">${escapeHtml(data.supportEmail)}</a>.</p>`
    : '';

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:24px 12px;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:8px;">
<tr><td style="padding:24px;">
<p style="margin:0 0 16px;font-size:20px;font-weight:700;color:#111827;">${escapeHtml(data.brandName)}</p>
<p style="margin:0 0 12px;font-size:18px;font-weight:700;color:#111827;">${escapeHtml(heading)}</p>
<p style="font-size:14px;color:#111827;">Dear ${escapeHtml(data.customerName)},</p>
<p style="font-size:14px;line-height:1.5;color:#374151;">${escapeHtml(message)}</p>
<p style="margin:16px 0 4px;font-size:14px;color:#111827;"><strong>Order number:</strong> ${escapeHtml(data.orderNumber)}</p>
<p style="margin:0 0 12px;font-size:14px;color:#111827;"><strong>Restaurant:</strong> ${escapeHtml(data.restaurantName)}</p>
${detailRows ? `<table role="presentation" cellpadding="0" cellspacing="0">\n${detailRows}\n</table>` : ''}
${linkParagraphs}
<div style="margin-top:24px;">
${supportLine}
<p style="font-size:14px;color:#374151;">Bon appetit,<br>${escapeHtml(data.brandName)} Team</p>
</div>
<p style="margin-top:24px;font-size:12px;color:#9ca3af;">This message is system generated. Please do not reply to this email.</p>
</td></tr>
</table>
</body>
</html>`;

  const text = [
    `Dear ${data.customerName},`,
    '',
    message,
    '',
    `Order number: ${data.orderNumber}`,
    `Restaurant: ${data.restaurantName}`,
    ...details.map(([label, value]) => `${label}: ${value}`),
    ...(links.length ? ['', ...links.map(([label, url]) => `${label}: ${url}`)] : []),
    '',
    ...(data.supportEmail ? [`Questions about your order? Contact ${data.supportEmail}.`, ''] : []),
    'Bon appetit,',
    `${data.brandName} Team`,
    '',
    'This message is system generated. Please do not reply to this email.',
  ].join('\n');

  return { subject, html, text };
}
