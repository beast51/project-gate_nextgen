import { describe, expect, it } from 'vitest';
import { GateUserDto } from '@/contracts';
import { blackListWithChangedGateUser, withChangedGateUser, withoutGateUser } from './gateUsersCache';

const user = (phoneNumber: string, overrides: Partial<GateUserDto> = {}): GateUserDto => ({
  idInApi: `ext-${phoneNumber}`,
  name: 'Ivan',
  phoneNumber,
  carNumber: ['AA1111AA'],
  apartmentNumber: '12',
  image: 'photo.png',
  isBlackListed: false,
  blackListedFrom: '',
  blackListedTo: '',
  ...overrides,
});

describe('cached lists of gate users', () => {
  // regression: a removed user stayed in the list until the page was reloaded
  it('lose a removed user at once', () => {
    expect(withoutGateUser([user('1'), user('2')], '1')).toEqual([user('2')]);
  });

  it('stay untouched when the list was never loaded', () => {
    expect(withoutGateUser(undefined, '1')).toBeUndefined();
    expect(withChangedGateUser(undefined, user('1'))).toBeUndefined();
    expect(blackListWithChangedGateUser(undefined, user('1'))).toBeUndefined();
  });

  it('show the new state of a changed user and keep what the change does not mention', () => {
    const blocked = { ...user('1', { isBlackListed: true, blackListedTo: '2024-03-17 23:50:00' }), image: undefined };

    const [changed, other] = withChangedGateUser([user('1'), user('2')], blocked)!;

    expect(changed.isBlackListed).toBe(true);
    expect(changed.blackListedTo).toBe('2024-03-17 23:50:00');
    expect(other).toEqual(user('2'));
  });

  it('add a blocked user to the black list in the order of apartments', () => {
    const list = [user('1', { isBlackListed: true, apartmentNumber: '10' }), user('3', { isBlackListed: true, apartmentNumber: '30' })];

    const result = blackListWithChangedGateUser(list, user('2', { isBlackListed: true, apartmentNumber: '20' }))!;

    expect(result.map(u => u.phoneNumber)).toEqual(['1', '2', '3']);
  });

  it('drop an unblocked user from the black list', () => {
    const list = [user('1', { isBlackListed: true }), user('2', { isBlackListed: true })];

    expect(blackListWithChangedGateUser(list, user('1'))!.map(u => u.phoneNumber)).toEqual(['2']);
  });
});
