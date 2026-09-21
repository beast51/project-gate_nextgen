import { describe, expect, it } from 'vitest';
import { GateUserType } from '@/entitiesLayer/GateUser/model/types/GateUser.type';
import { filterGateUsers } from './useSearchAndPagination';

const user = (overrides: Partial<GateUserType>): GateUserType => ({
  idInApi: '1',
  name: 'Ivan',
  phoneNumber: '380501111111',
  carNumber: ['AA1111AA'],
  apartmentNumber: '12',
  isBlackListed: false,
  blackListedFrom: '',
  blackListedTo: '',
  ...overrides,
});

const users = [
  user({}),
  user({ name: 'Olga', phoneNumber: '380502222222', carNumber: ['BC7777KA', 'KA0001AA'], apartmentNumber: '45' }),
  user({ name: 'Guard', phoneNumber: '380503333333', carNumber: [], apartmentNumber: null }),
];

describe('filterGateUsers', () => {
  it('returns everyone for an empty query', () => {
    expect(filterGateUsers(users, '')).toEqual(users);
  });

  it('searches by name, car number, phone number and apartment, ignoring the case', () => {
    expect(filterGateUsers(users, 'olg').map(u => u.name)).toEqual(['Olga']);
    expect(filterGateUsers(users, 'ka0001').map(u => u.name)).toEqual(['Olga']);
    expect(filterGateUsers(users, '3333').map(u => u.name)).toEqual(['Guard']);
    expect(filterGateUsers(users, '45').map(u => u.name)).toEqual(['Olga']);
    expect(filterGateUsers(users, 'nobody')).toEqual([]);
  });

  it('searches by one field when a mode is chosen', () => {
    // "1" is in every phone number, and only one apartment starts with it
    expect(filterGateUsers(users, '1', 'apartment').map(u => u.name)).toEqual(['Ivan']);
    expect(filterGateUsers(users, '050-222', 'phone').map(u => u.name)).toEqual(['Olga']);
    expect(filterGateUsers(users, 'вс 7777', 'car').map(u => u.name)).toEqual(['Olga']);
    expect(filterGateUsers(users, 'olga', 'car')).toEqual([]);
  });

  it('sees a user that appears in a refreshed list', () => {
    const refreshed = [...users, user({ name: 'New resident', phoneNumber: '380504444444' })];

    expect(filterGateUsers(refreshed, 'new res')).toHaveLength(1);
  });
});
