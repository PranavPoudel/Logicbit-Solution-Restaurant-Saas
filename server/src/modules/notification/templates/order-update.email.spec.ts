import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { buildOrderUpdateEmail, OrderUpdateData } from './order-update.email';

const base: OrderUpdateData = {
  kind: 'PICKED_UP',
  brandName: 'LogicBit',
  customerName: 'Sita',
  orderNumber: 'ORD-1',
  orderType: 'DELIVERY',
  restaurantName: 'Momo House',
  orderUrl: 'https://app.test/en/orders/o1',
  driver: { name: 'Hari', phone: '9811111111', vehicle: 'Red scooter', trackingUrl: 'https://track.test/abc' },
};

describe('buildOrderUpdateEmail', () => {
  it('tells the customer the driver picked the order up, with driver details and tracking', () => {
    const { subject, text, html } = buildOrderUpdateEmail(base);
    assert.equal(subject, 'Your driver has picked up order ORD-1');
    assert.ok(text.includes('Driver: Hari'));
    assert.ok(text.includes('Driver phone: 9811111111'));
    assert.ok(text.includes('Track your delivery: https://track.test/abc'));
    assert.ok(html.includes('href="https://track.test/abc"'));
  });

  it('works when the driver details are not known', () => {
    const { text } = buildOrderUpdateEmail({ ...base, driver: undefined });
    assert.ok(!text.includes('Driver:'));
    assert.ok(text.includes('View your order: https://app.test/en/orders/o1'));
  });

  it('thanks the customer once the order is delivered, without driver tracking', () => {
    const { subject, text } = buildOrderUpdateEmail({ ...base, kind: 'DELIVERED' });
    assert.equal(subject, 'Thank you for ordering with LogicBit');
    assert.ok(text.includes('Thank you for using LogicBit'));
    assert.ok(!text.includes('Track your delivery'));
  });

  it('escapes customer and driver text in the HTML', () => {
    const { html } = buildOrderUpdateEmail({
      ...base,
      customerName: '<script>x</script>',
      driver: { name: '"><img src=x>', trackingUrl: 'https://t.test/?a="b"' },
    });
    assert.ok(!html.includes('<script>'));
    assert.ok(!html.includes('<img'));
    assert.ok(!html.includes('a="b"'));
  });
});
