import { describe, expect, it } from 'vitest';
import { GateUser } from '@/core/entities/gateUser';
import { fromGateUserDto, toGateUserDto, toViolationsResponse } from './mappers';

const user: GateUser = {
  id: 'db-id',
  externalId: '777',
  name: 'Ivan',
  phoneNumber: '380501111111',
  carNumber: ['AA1111AA'],
  apartmentNumber: '12',
  image: null,
  additionalImages: [],
  isBlackListed: false,
  blackListedFrom: '',
  blackListedTo: '',
};

describe('API mappers', () => {
  it('shows the telephony id under its historical contract name and takes it back', () => {
    const dto = toGateUserDto(user);

    expect(dto).toEqual({ ...user, externalId: undefined, idInApi: '777' });
    expect('externalId' in dto).toBe(false);
    expect(fromGateUserDto(dto)).toEqual(user);
  });

  it('keeps the violations response as it is', () => {
    const visits = {
      '12': {
        visitCount: 1,
        violationCount: 0,
        visits: [{ timeIn: '2024-03-10 10:00:00', timeOut: null, thisVisitTime: null, violationTime: null, violation: '' }],
        aboutUser: { number: ['380501111111'], carNumber: ['AA1111AA'], image: null, name: 'Ivan' },
      },
    };

    expect(toViolationsResponse(visits)).toEqual(visits);
  });
});
