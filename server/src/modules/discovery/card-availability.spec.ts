import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { DiscoveryService } from './discovery.service';
import { ChatBotService } from '../chats/chat-bot.service';

// Card must only be offered to customers when the restaurant has a Stripe key saved, otherwise checkout fails after the cart is filled.

const restaurant = { id: 'r1', name: 'Momo House', isOpen: true, supportsCod: true, supportsCreditCard: true, stripeSecretKey: 'enc:v1:abc' };

describe('public restaurant: card availability', () => {
  const shape = (row: object) => (new DiscoveryService(null as any, null as any, null as any) as any).toPublicRestaurantShape(row, []);

  it('offers card when the switch is on and a Stripe key is saved', () => {
    assert.equal(shape(restaurant).supportsCreditCard, true);
  });

  it('does not offer card when the switch is on but no key is saved', () => {
    assert.equal(shape({ ...restaurant, stripeSecretKey: null }).supportsCreditCard, false);
  });

  it('does not offer card when the switch is off, even with a key', () => {
    assert.equal(shape({ ...restaurant, supportsCreditCard: false }).supportsCreditCard, false);
  });

  it('never puts the key in the public response', () => {
    const body = JSON.stringify(shape(restaurant));
    assert.ok(!body.includes('stripeSecretKey'));
    assert.ok(!body.includes('enc:v1'));
  });
});

describe('chatbot: card availability', () => {
  const load = async (row: object | null) => {
    const prisma = { restaurant: { findUnique: async () => row } };
    return (new ChatBotService(prisma as any, null as any) as any).loadRestaurant('r1');
  };

  it('tells customers about card only when a key is saved', async () => {
    assert.equal((await load(restaurant)).supportsCreditCard, true);
    assert.equal((await load({ ...restaurant, stripeSecretKey: null })).supportsCreditCard, false);
    assert.equal((await load({ ...restaurant, supportsCreditCard: false })).supportsCreditCard, false);
  });

  it('does not keep the key on the row it returns', async () => {
    const row = await load(restaurant);
    assert.ok(!('stripeSecretKey' in row));
  });

  it('returns nothing for an unknown restaurant', async () => {
    assert.equal(await load(null), null);
  });
});
