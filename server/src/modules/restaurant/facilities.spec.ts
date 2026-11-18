import 'reflect-metadata';
import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';

const check = (facilities: unknown) => validate(plainToInstance(UpdateRestaurantDto, { facilities }));

test('facilities: accepts known keys and an empty list', async () => {
  assert.equal((await check(['parking', 'wifi'])).length, 0);
  assert.equal((await check([])).length, 0);
});

test('facilities: is optional', async () => {
  assert.equal((await validate(plainToInstance(UpdateRestaurantDto, {}))).length, 0);
});

test('facilities: rejects unknown keys, duplicates and non-lists', async () => {
  assert.ok((await check(['jacuzzi'])).length > 0);
  assert.ok((await check(['wifi', 'wifi'])).length > 0);
  assert.ok((await check('wifi')).length > 0);
});
