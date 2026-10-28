export interface OrderEmailItem {
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
  notes?: string | null;
}

export interface OrderEmailData {
  brandName: string;
  supportEmail?: string;
  customerName: string;
  orderNumber: string;
  createdAt: Date;
  orderType: 'DELIVERY' | 'PICKUP' | 'DINE_IN';
  restaurantName: string;
  currencyCode: string;
  deliveryAddress?: string | null;
  phone?: string | null;
  paymentMethod: string;
  paymentStatus: string;
  items: OrderEmailItem[];
  subtotal: number;
  deliveryFee: number;
  tax: number;
  discountAmount: number;
  couponCode?: string | null;
  total: number;
}

export interface BuiltEmail {
  subject: string;
  html: string;
  text: string;
}

const escapeHtml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const paymentLabel = (method: string, status: string) =>
  method === 'COD' ? 'Cash on delivery' : `${method.replace(/_/g, ' ')} (${status === 'PAID' ? 'paid' : 'payment pending'})`;

const orderTypeLabel = { DELIVERY: 'Delivery', PICKUP: 'Pickup', DINE_IN: 'Dine in' } as const;

export function buildOrderConfirmationEmail(data: OrderEmailData): BuiltEmail {
  const money = (amount: number) => {
    try {
      return new Intl.NumberFormat('en', { style: 'currency', currency: data.currencyCode, currencyDisplay: 'narrowSymbol' }).format(amount);
    } catch {
      return `${data.currencyCode} ${amount.toFixed(2)}`;
    }
  };

  const date = data.createdAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const subject = `Order ${data.orderNumber} confirmed - ${data.restaurantName}`;
  const intro = `Thank you for ordering via ${data.brandName}. ${data.restaurantName} has accepted your order and it will be processed soon. Below is the summary of your order.`;

  const details: [string, string][] = [['Order type', orderTypeLabel[data.orderType]]];
  if (data.orderType === 'DELIVERY') {
    details.push(['Delivery time', 'As soon as possible']);
    if (data.deliveryAddress) details.push(['Delivery address', data.deliveryAddress]);
  } else if (data.orderType === 'PICKUP') {
    details.push(['Pickup at', data.restaurantName]);
  }
  if (data.phone) details.push(['Phone', data.phone]);
  details.push(['Payment', paymentLabel(data.paymentMethod, data.paymentStatus)]);

  const totals: [string, string, boolean?][] = [['Subtotal', money(data.subtotal)]];
  if (data.discountAmount > 0) totals.push([`Discount${data.couponCode ? ` (${data.couponCode})` : ''}`, `-${money(data.discountAmount)}`]);
  totals.push(['Tax', money(data.tax)], ['Delivery charge', money(data.deliveryFee)], ['Total', money(data.total), true]);

  const cell = 'padding:8px 6px;border-bottom:1px solid #e5e7eb;font-size:14px;color:#111827;';
  const itemRows = data.items
    .map(
      (i) => `<tr>
  <td style="${cell}">${escapeHtml(i.name)}${i.notes ? `<br><span style="font-size:12px;color:#6b7280;">${escapeHtml(i.notes)}</span>` : ''}</td>
  <td style="${cell}text-align:center;">${i.quantity}</td>
  <td style="${cell}text-align:right;">${money(i.unitPrice)}</td>
  <td style="${cell}text-align:right;">${money(i.total)}</td>
</tr>`,
    )
    .join('\n');

  const totalRows = totals
    .map(
      ([label, value, strong]) => `<tr>
  <td colspan="3" style="padding:6px;text-align:right;font-size:14px;color:#374151;${strong ? 'font-weight:700;' : ''}">${escapeHtml(label)}</td>
  <td style="padding:6px;text-align:right;font-size:14px;color:#111827;${strong ? 'font-weight:700;border-top:2px solid #111827;' : ''}">${value}</td>
</tr>`,
    )
    .join('\n');

  const detailRows = details
    .map(([label, value]) => `<tr><td style="padding:3px 12px 3px 0;font-size:14px;color:#6b7280;vertical-align:top;white-space:nowrap;">${escapeHtml(label)}</td><td style="padding:3px 0;font-size:14px;color:#111827;">${escapeHtml(value)}</td></tr>`)
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
<p style="font-size:14px;color:#111827;">Dear ${escapeHtml(data.customerName)},</p>
<p style="font-size:14px;line-height:1.5;color:#374151;">${escapeHtml(intro)}</p>
<p style="margin:20px 0 4px;font-size:14px;color:#111827;"><strong>Order number:</strong> ${escapeHtml(data.orderNumber)}</p>
<p style="margin:0 0 4px;font-size:14px;color:#111827;"><strong>Order date:</strong> ${date}</p>
<p style="margin:0 0 4px;font-size:14px;color:#111827;"><strong>Order total:</strong> ${money(data.total)}</p>
<p style="margin:0 0 16px;font-size:14px;color:#111827;"><strong>Restaurant:</strong> ${escapeHtml(data.restaurantName)}</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
${detailRows}
</table>
<p style="margin:0 0 8px;font-size:15px;font-weight:700;color:#111827;">Cart detail</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
<tr>
  <th style="padding:8px 6px;text-align:left;font-size:13px;color:#6b7280;border-bottom:2px solid #111827;">Name</th>
  <th style="padding:8px 6px;text-align:center;font-size:13px;color:#6b7280;border-bottom:2px solid #111827;">Qty.</th>
  <th style="padding:8px 6px;text-align:right;font-size:13px;color:#6b7280;border-bottom:2px solid #111827;">Price</th>
  <th style="padding:8px 6px;text-align:right;font-size:13px;color:#6b7280;border-bottom:2px solid #111827;">Total</th>
</tr>
${itemRows}
${totalRows}
</table>
<div style="margin-top:24px;">
${supportLine}
<p style="font-size:14px;color:#374151;">Bon appetit,<br>${escapeHtml(data.brandName)} Team</p>
</div>
<p style="margin-top:24px;font-size:12px;color:#9ca3af;">This message is system generated. Please do not reply to this email.</p>
</td></tr>
</table>
</body>
</html>`;

  const textLines = [
    `Dear ${data.customerName},`,
    '',
    intro,
    '',
    `Order number: ${data.orderNumber}`,
    `Order date: ${date}`,
    `Order total: ${money(data.total)}`,
    `Restaurant: ${data.restaurantName}`,
    '',
    ...details.map(([label, value]) => `${label}: ${value}`),
    '',
    'Cart detail',
    ...data.items.map((i) => `- ${i.name} x${i.quantity}  ${money(i.total)}${i.notes ? ` (${i.notes})` : ''}`),
    '',
    ...totals.map(([label, value]) => `${label}: ${value}`),
    '',
    ...(data.supportEmail ? [`Questions about your order? Contact ${data.supportEmail}.`, ''] : []),
    'Bon appetit,',
    `${data.brandName} Team`,
    '',
    'This message is system generated. Please do not reply to this email.',
  ];

  return { subject, html: html.replace(/ /g, '&nbsp;'), text: textLines.join('\n') };
}
