import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { findCityByName, nearestCity } from './city-match.util';

const CITIES = [
  { name: 'Tokyo', nameJa: '東京', latitude: 35.6762, longitude: 139.6503 },
  { name: 'Nagoya', nameJa: '名古屋', latitude: 35.1815, longitude: 136.9066 },
  { name: 'Zushi', nameJa: null, latitude: 35.2955, longitude: 139.5786 },
];

describe('findCityByName', () => {
  it('matches the English or the Japanese name, ignoring case and spaces', () => {
    assert.equal(findCityByName(CITIES, ' tokyo ')?.name, 'Tokyo');
    assert.equal(findCityByName(CITIES, '名古屋')?.name, 'Nagoya');
  });

  it('does not match address text, partial names or nothing', () => {
    assert.equal(findCityByName(CITIES, 'Tokyo, Japan'), undefined);
    assert.equal(findCityByName(CITIES, 'Zushi City'), undefined);
    assert.equal(findCityByName(CITIES, '  '), undefined);
    assert.equal(findCityByName(CITIES, undefined), undefined);
  });
});

describe('nearestCity', () => {
  it('picks the closest listed city', () => {
    assert.equal(nearestCity(CITIES, 35.4437, 139.638)?.name, 'Zushi');
    assert.equal(nearestCity(CITIES, 35.0, 137.0)?.name, 'Nagoya');
  });

  it('returns nothing when there is no pin or no city within 100 km', () => {
    assert.equal(nearestCity(CITIES, undefined, 139.6), undefined);
    assert.equal(nearestCity(CITIES, 27.7172, 85.324), undefined);
    assert.equal(nearestCity([], 35.6, 139.6), undefined);
  });
});
