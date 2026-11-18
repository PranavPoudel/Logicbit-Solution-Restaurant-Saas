import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { buildNewOrderOwnerEmail, NewOrderOwnerData } from './new-order-owner.email';

const order: NewOrderOwnerData = {
  brandName: 'LogicBit',
  restaurantName: 'Momo House',
  orderNumber: 'ORD-9',
  orderType: 'DELIVERY',
  currencyCode: 'JPY',
  customerName: 'Sita',
  customerPhone: '9800000000',
  deliveryAddress: 'Patan, Lalitpur',
  paymentMethod: 'COD',
  paymentStatus: 'UNPAID',
  items: [{ name: 'Veg Momo', quantity: 2, total: 1154, notes: 'extra spicy' }],
  total: 1154,
  dashboardUrl: 'https://app.test/owner/orders',
};

describe('buildNewOrderOwnerEmail', () => {
  it('puts the amount in the subject and lists items, customer and payment', () => {
    const { subject, text } = buildNewOrderOwnerEmail(order);
    assert.equal(subject, 'New order ORD-9 - ¥1,154');
    assert.ok(text.includes('Veg Momo x2'));
    assert.ok(text.includes('extra spicy'));
    assert.ok(text.includes('Customer: Sita'));
    assert.ok(text.includes('Payment: Cash on delivery'));
    assert.ok(text.includes('Open your orders: https://app.test/owner/orders'));
  });

  it('shows the address only for delivery orders', () => {
    assert.ok(buildNewOrderOwnerEmail(order).text.includes('Patan, Lalitpur'));
    assert.ok(!buildNewOrderOwnerEmail({ ...order, orderType: 'PICKUP' }).text.includes('Patan, Lalitpur'));
  });

  it('escapes customer-controlled text in the HTML', () => {
    const { html } = buildNewOrderOwnerEmail({ ...order, customerName: '<script>x</script>', items: [{ name: '<img src=x>', quantity: 1, total: 1 }] });
    assert.ok(!html.includes('<script>'));
    assert.ok(!html.includes('<img'));
  });
});
