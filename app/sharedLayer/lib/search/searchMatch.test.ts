import { describe, expect, it } from 'vitest';
import { matchesSearch, Searchable } from './searchMatch';

const resident: Searchable = { phones: ['380674821822', '380501112233'], apartment: '12', cars: ['BH 1096 IC'], name: 'Olga' };

describe('matchesSearch', () => {
  it('matches everything for an empty query', () => {
    expect(matchesSearch(resident, '', 'phone')).toBe(true);
    expect(matchesSearch(resident, '   ', 'car')).toBe(true);
  });

  it('phone: any part of the number, however it is typed', () => {
    ['067-482', '067482', '38067482', '(067) 482 18', '1822'].forEach(query =>
      expect(matchesSearch(resident, query, 'phone')).toBe(true));

    expect(matchesSearch(resident, '0999', 'phone')).toBe(false);
    expect(matchesSearch(resident, 'olga', 'phone')).toBe(false);
    // the second number of the apartment
    expect(matchesSearch(resident, '050111', 'phone')).toBe(true);
  });

  it('apartment: by the beginning only', () => {
    expect(matchesSearch(resident, '1', 'apartment')).toBe(true);
    expect(matchesSearch(resident, '12', 'apartment')).toBe(true);
    expect(matchesSearch(resident, '2', 'apartment')).toBe(false);
    expect(matchesSearch(resident, '120', 'apartment')).toBe(false);
    expect(matchesSearch({ ...resident, apartment: '312' }, '12', 'apartment')).toBe(false);
    expect(matchesSearch({ ...resident, apartment: '12А' }, '12a', 'apartment')).toBe(true);
    expect(matchesSearch({ ...resident, apartment: null }, '1', 'apartment')).toBe(false);
  });

  it('car: any part of the plate, spaces, case and the alphabet do not matter', () => {
    ['вн1096', 'BH 1096', 'bh1096ic', '096', 'іс', '1096-IC'].forEach(query =>
      expect(matchesSearch(resident, query, 'car')).toBe(true));

    expect(matchesSearch(resident, 'AA', 'car')).toBe(false);
    expect(matchesSearch({ ...resident, cars: [] }, '1096', 'car')).toBe(false);
    expect(matchesSearch({ ...resident, cars: null }, '1096', 'car')).toBe(false);
  });

  it('a mode does not look into other fields', () => {
    expect(matchesSearch(resident, '1096', 'phone')).toBe(false);
    expect(matchesSearch(resident, '482', 'car')).toBe(false);
    expect(matchesSearch(resident, '482', 'apartment')).toBe(false);
  });

  it('all: the name, the car, the apartment and the phone', () => {
    expect(matchesSearch(resident, 'olg', 'all')).toBe(true);
    expect(matchesSearch(resident, 'вн 1096', 'all')).toBe(true);
    expect(matchesSearch(resident, '12', 'all')).toBe(true);
    expect(matchesSearch(resident, '067-482', 'all')).toBe(true);
    expect(matchesSearch(resident, 'nobody', 'all')).toBe(false);
  });

  it('all: the digits of a number plate are not looked for in phone numbers', () => {
    const other: Searchable = { phones: ['380671096000'], apartment: '7', cars: ['AA 0001 AA'] };

    expect(matchesSearch(other, 'BH 1096', 'all')).toBe(false);
    expect(matchesSearch(other, '1096', 'all')).toBe(true);
  });
});
