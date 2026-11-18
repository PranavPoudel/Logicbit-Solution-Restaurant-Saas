import { BuiltEmail, escapeHtml, formatMoney, orderTypeLabel, paymentLabel } from './order-confirmation.email';

export interface NewOrderOwnerData {
  brandName: string;
  restaurantName: string;
  orderNumber: string;
  orderType: 'DELIVERY' | 'PICKUP' | 'DINE_IN';
  currencyCode: string;
  customerName: string;
  customerPhone?: string | null;
  deliveryAddress?: string | null;
  paymentMethod: string;
  paymentStatus: string;
  items: { name: string; quantity: number; total: number; notes?: string | null }[];
  total: number;
  /** Where the owner accepts the order. */
  dashboardUrl?: string;
}

export function buildNewOrderOwnerEmail(data: NewOrderOwnerData): BuiltEmail {
  const money = (amount: number) => formatMoney(data.currencyCode, amount);
  const subject = `New order ${data.orderNumber} - ${money(data.total)}`;

  const details: [string, string][] = [
    ['Customer', data.customerName],
    ['Order type', orderTypeLabel[data.orderType]],
  ];
  if (data.customerPhone) details.push(['Phone', data.customerPhone]);
  if (data.orderType === 'DELIVERY' && data.deliveryAddress) details.push(['Delivery address', data.deliveryAddress]);
  details.push(['Payment', paymentLabel(data.paymentMethod, data.paymentStatus)]);

  const cell = 'padding:8px 6px;border-bottom:1px solid #e5e7eb;font-size:14px;color:#111827;';
  const itemRows = data.items
    .map(
      (i) => `<tr>
  <td style="${cell}">${escapeHtml(i.name)}${i.notes ? `<br><span style="font-size:12px;color:#6b7280;">${escapeHtml(i.notes)}</span>` : ''}</td>
  <td style="${cell}text-align:center;">x${i.quantity}</td>
  <td style="${cell}text-align:right;">${money(i.total)}</td>
</tr>`,
    )
    .join('\n');

  const detailRows = details
    .map(([label, value]) => `<tr><td style="padding:3px 12px 3px 0;font-size:14px;color:#6b7280;vertical-align:top;white-space:nowrap;">${escapeHtml(label)}</td><td style="padding:3px 0;font-size:14px;color:#111827;">${escapeHtml(value)}</td></tr>`)
    .join('\n');

  const button = data.dashboardUrl
    ? `<p style="margin:24px 0 0;"><a href="${escapeHtml(data.dashboardUrl)}" style="display:inline-block;padding:10px 18px;background:#111827;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;border-radius:6px;">Open your orders</a></p>`
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
<p style="margin:0 0 4px;font-size:18px;font-weight:700;color:#111827;">You have a new order</p>
<p style="margin:0 0 16px;font-size:14px;color:#374151;">${escapeHtml(data.restaurantName)} &middot; ${escapeHtml(data.orderNumber)}</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
${detailRows}
</table>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
<tr>
  <th style="padding:8px 6px;text-align:left;font-size:13px;color:#6b7280;border-bottom:2px solid #111827;">Item</th>
  <th style="padding:8px 6px;text-align:center;font-size:13px;color:#6b7280;border-bottom:2px solid #111827;">Qty.</th>
  <th style="padding:8px 6px;text-align:right;font-size:13px;color:#6b7280;border-bottom:2px solid #111827;">Total</th>
</tr>
${itemRows}
<tr>
  <td colspan="2" style="padding:8px 6px;text-align:right;font-size:14px;font-weight:700;color:#111827;">Order total</td>
  <td style="padding:8px 6px;text-align:right;font-size:14px;font-weight:700;color:#111827;border-top:2px solid #111827;">${money(data.total)}</td>
</tr>
</table>
${button}
<p style="margin-top:24px;font-size:12px;color:#9ca3af;">This message is system generated. Please do not reply to this email.</p>
</td></tr>
</table>
</body>
</html>`;

  const text = [
    `You have a new order at ${data.restaurantName}`,
    `Order number: ${data.orderNumber}`,
    '',
    ...details.map(([label, value]) => `${label}: ${value}`),
    '',
    'Items',
    ...data.items.map((i) => `- ${i.name} x${i.quantity}  ${money(i.total)}${i.notes ? ` (${i.notes})` : ''}`),
    '',
    `Order total: ${money(data.total)}`,
    ...(data.dashboardUrl ? ['', `Open your orders: ${data.dashboardUrl}`] : []),
    '',
    'This message is system generated. Please do not reply to this email.',
  ].join('\n');

  return { subject, html, text };
}
