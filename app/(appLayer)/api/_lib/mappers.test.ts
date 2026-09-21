import { PENALTY_GROUNDS as CONTRACT_GROUNDS, PENALTY_LIFT_GROUNDS as CONTRACT_LIFT_GROUNDS } from '@/contracts';
import { PENALTY_GROUNDS, PENALTY_LIFT_GROUNDS } from '@/core/entities/penalty';
import { describe, expect, it } from 'vitest';
import { FAILED_CALL_OUTCOMES } from '@/contracts';
import { CALL_OUTCOMES, isPassageOutcome } from '@/core/entities/call';
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

describe('grounds of penalties', () => {
  it('are the same in the contract and in the core', () => {
    expect([...CONTRACT_GROUNDS]).toEqual([...PENALTY_GROUNDS]);
    expect([...CONTRACT_LIFT_GROUNDS]).toEqual([...PENALTY_LIFT_GROUNDS]);
  });
});

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

  // the front end decides how to show a call with the list from the contract, the core with its own rule
  it('agrees with the contract about the calls the gate did not open for', () => {
    CALL_OUTCOMES.forEach(outcome => {
      expect(FAILED_CALL_OUTCOMES.includes(outcome)).toBe(!isPassageOutcome(outcome));
    });
  });
});
