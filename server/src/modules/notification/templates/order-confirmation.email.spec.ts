import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { buildOrderConfirmationEmail, OrderEmailData } from './order-confirmation.email';

const order: OrderEmailData = {
  brandName: 'LogicBit',
  customerName: 'Sita',
  orderNumber: 'ORD-1',
  createdAt: new Date('2026-10-11T10:00:00Z'),
  orderType: 'DELIVERY',
  restaurantName: 'Momo House',
  currencyCode: 'NPR',
  deliveryAddress: 'Patan, Lalitpur',
  phone: '9800000000',
  paymentMethod: 'COD',
  paymentStatus: 'UNPAID',
  items: [{ name: 'Chicken Momo', quantity: 2, unitPrice: 200, total: 400 }],
  subtotal: 400,
  deliveryFee: 50,
  tax: 0,
  discountAmount: 0,
  total: 450,
};

describe('buildOrderConfirmationEmail', () => {
  it('escapes customer-controlled text in the HTML', () => {
    const { html } = buildOrderConfirmationEmail({
      ...order,
      customerName: '<script>alert(1)</script>',
      deliveryAddress: '"><img src=x onerror=alert(1)>',
      items: [{ ...order.items[0], notes: '<b>no onions</b>' }],
    });
    assert.ok(!html.includes('<script>'));
    assert.ok(!html.includes('<img'));
    assert.ok(!html.includes('<b>no onions'));
    assert.ok(html.includes('&lt;script&gt;'));
  });

  it('shows the discount line only when there is a discount', () => {
    assert.ok(!buildOrderConfirmationEmail(order).text.includes('Discount'));
    const withDiscount = buildOrderConfirmationEmail({ ...order, discountAmount: 40, couponCode: 'SAVE40' });
    assert.ok(withDiscount.text.includes('Discount (SAVE40)'));
  });

  it('shows the delivery address only for delivery orders', () => {
    assert.ok(buildOrderConfirmationEmail(order).text.includes('Patan, Lalitpur'));
    const pickup = buildOrderConfirmationEmail({ ...order, orderType: 'PICKUP' });
    assert.ok(!pickup.text.includes('Patan, Lalitpur'));
    assert.ok(pickup.text.includes('Pickup at: Momo House'));
  });

  it('declares utf-8 and never emits raw non-breaking spaces', () => {
    const { html } = buildOrderConfirmationEmail(order);
    assert.ok(html.includes('<meta charset="utf-8">'));
    assert.ok(!html.includes(' '));
  });

  it('formats money in the order currency without inventing decimals', () => {
    assert.ok(buildOrderConfirmationEmail(order).text.includes('Total: Rs 450.00'));
    const yen = buildOrderConfirmationEmail({ ...order, currencyCode: 'JPY', total: 1080 });
    assert.ok(yen.text.includes('Total: ¥1,080'));
    assert.ok(!yen.text.includes('1,080.00'));
  });
});
