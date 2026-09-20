// Characterization cases for findViolations.
// They fix the behaviour that existed BEFORE the logic was moved to core,
// the same cases run against the legacy service and against the core use case.

export type FixtureCall = {
  number: string
  time: string
  carNumber: string[]
  callerName: string | null
  apartmentNumber: string | null
  image: string | null
  isBlackListed?: boolean | null
  blackListedFrom: string | null
  blackListedTo: string | null
  secondsFullTime: number | null
  cause: number | null
  state: string | null
}

export type FindViolationsCase = {
  name: string
  now: string
  calls: FixtureCall[]
  expected: Record<string, unknown>
}

const DAY = '2024-03-10';
const NOW = `${DAY} 12:00:00`;

const call = (number: string, time: string, overrides: Partial<FixtureCall> = {}): FixtureCall => ({
  number,
  time: `${DAY} ${time}`,
  carNumber: ['AA1111AA'],
  callerName: 'Ivan',
  apartmentNumber: '12',
  image: null,
  isBlackListed: false,
  blackListedFrom: '',
  blackListedTo: '',
  secondsFullTime: 5,
  cause: 17,
  state: 'BUSY',
  ...overrides,
});

export const findViolationsCases: FindViolationsCase[] = [
  {
    name: 'no calls give an empty result',
    now: NOW,
    calls: [],
    expected: {},
  },
  {
    name: 'repeated calls from one number within 2 minutes count as a single entry',
    now: NOW,
    calls: [
      call('380501111111', '10:00:00'),
      call('380501111111', '10:00:30'),
      call('380501111111', '10:01:00'),
      call('380501111111', '10:20:00'),
    ],
    expected: {
      '12': {
        visitCount: 1,
        violationCount: 0,
        visits: [
          {
            timeIn: `${DAY} 10:00:00`,
            timeOut: `${DAY} 10:20:00`,
            thisVisitTime: null,
            violationTime: 20,
            violation: 'no violation',
          },
        ],
        aboutUser: { number: ['380501111111'], carNumber: ['AA1111AA'], image: null, name: 'Ivan' },
      },
    },
  },
  {
    name: 'a stay of 45 minutes or more is a violation, numbers of one apartment are merged',
    now: NOW,
    calls: [
      call('380502222222', '09:00:00', { apartmentNumber: '7', callerName: 'Olga', carNumber: ['BB2222BB'] }),
      call('380503333333', '09:00:10', { apartmentNumber: '8', callerName: 'Petro' }),
      call('380504444444', '09:00:20', { apartmentNumber: '9', callerName: 'Anna' }),
      call('380504444444', '09:44:59', { apartmentNumber: '9', callerName: 'Anna' }),
      call('380503333333', '09:45:10', { apartmentNumber: '8', callerName: 'Petro' }),
      call('380505555555', '09:50:00', { apartmentNumber: '7', callerName: 'Olga second phone', carNumber: ['CC3333CC'] }),
    ],
    expected: {
      '7': {
        visitCount: 1,
        violationCount: 1,
        visits: [
          {
            timeIn: `${DAY} 09:00:00`,
            timeOut: `${DAY} 09:50:00`,
            thisVisitTime: null,
            violationTime: 50,
            violation: 'has been parked for 50 minutes',
          },
        ],
        aboutUser: { number: ['380502222222', '380505555555'], carNumber: ['BB2222BB'], image: null, name: 'Olga' },
      },
      '8': {
        visitCount: 1,
        violationCount: 1,
        visits: [
          {
            timeIn: `${DAY} 09:00:10`,
            timeOut: `${DAY} 09:45:10`,
            thisVisitTime: null,
            violationTime: 45,
            violation: 'has been parked for 45 minutes',
          },
        ],
        aboutUser: { number: ['380503333333'], carNumber: ['AA1111AA'], image: null, name: 'Petro' },
      },
      '9': {
        visitCount: 1,
        violationCount: 0,
        visits: [
          {
            timeIn: `${DAY} 09:00:20`,
            timeOut: `${DAY} 09:44:59`,
            thisVisitTime: null,
            violationTime: 44,
            violation: 'no violation',
          },
        ],
        aboutUser: { number: ['380504444444'], carNumber: ['AA1111AA'], image: null, name: 'Anna' },
      },
    },
  },
  {
    name: 'entry without exit: a violation only after the limit has passed',
    now: NOW,
    calls: [
      call('380506666666', '08:00:00', { apartmentNumber: '3' }),
      call('380507777777', '11:50:00', { apartmentNumber: '4' }),
    ],
    expected: {
      '3': {
        visitCount: 1,
        violationCount: 1,
        visits: [
          {
            timeIn: `${DAY} 08:00:00`,
            timeOut: null,
            thisVisitTime: null,
            violationTime: null,
            violation: 'still parked or train',
          },
        ],
        aboutUser: { number: ['380506666666'], carNumber: ['AA1111AA'], image: null, name: 'Ivan' },
      },
      '4': {
        visitCount: 1,
        violationCount: 0,
        visits: [
          {
            timeIn: `${DAY} 11:50:00`,
            timeOut: null,
            thisVisitTime: null,
            violationTime: null,
            violation: '',
          },
        ],
        aboutUser: { number: ['380507777777'], carNumber: ['AA1111AA'], image: null, name: 'Ivan' },
      },
    },
  },
  {
    name: 'an odd number of calls: the last visit stays open',
    now: NOW,
    calls: [
      call('380501111111', '09:00:00'),
      call('380501111111', '09:10:00'),
      call('380501111111', '11:55:00'),
    ],
    expected: {
      '12': {
        visitCount: 2,
        violationCount: 0,
        visits: [
          {
            timeIn: `${DAY} 09:00:00`,
            timeOut: `${DAY} 09:10:00`,
            thisVisitTime: null,
            violationTime: 10,
            violation: 'no violation',
          },
          {
            timeIn: `${DAY} 11:55:00`,
            timeOut: null,
            thisVisitTime: null,
            violationTime: null,
            violation: '',
          },
        ],
        aboutUser: { number: ['380501111111'], carNumber: ['AA1111AA'], image: null, name: 'Ivan' },
      },
    },
  },
  {
    name: 'calls without an apartment are grouped by phone number',
    now: NOW,
    calls: [
      call('380508888888', '10:00:00', { apartmentNumber: null, callerName: 'Guard', image: 'guard.png' }),
      call('380508888888', '11:00:00', { apartmentNumber: null, callerName: 'Guard', image: 'guard.png' }),
    ],
    expected: {
      '380508888888': {
        visitCount: 1,
        violationCount: 1,
        visits: [
          {
            timeIn: `${DAY} 10:00:00`,
            timeOut: `${DAY} 11:00:00`,
            thisVisitTime: null,
            violationTime: 60,
            violation: 'has been parked for 60 minutes',
          },
        ],
        aboutUser: { carNumber: ['AA1111AA'], image: 'guard.png', apartmentNumber: null, name: 'Guard' },
      },
    },
  },
  {
    name: 'blocked, unregistered and failed calls are ignored',
    now: NOW,
    calls: [
      call('380509999999', '08:00:00', { apartmentNumber: '20', isBlackListed: true }),
      call('380500000001', '08:05:00', { apartmentNumber: null, callerName: 'Not registered' }),
      call('380500000002', '08:10:00', { apartmentNumber: '21', cause: 31 }),
      call('380500000003', '08:15:00', { apartmentNumber: '22', cause: 38 }),
      call('380501111111', '09:00:00', { cause: null }),
      call('380501111111', '09:30:00', { cause: 16 }),
    ],
    expected: {
      '12': {
        visitCount: 1,
        violationCount: 0,
        visits: [
          {
            timeIn: `${DAY} 09:00:00`,
            timeOut: `${DAY} 09:30:00`,
            thisVisitTime: null,
            violationTime: 30,
            violation: 'no violation',
          },
        ],
        aboutUser: { number: ['380501111111'], carNumber: ['AA1111AA'], image: null, name: 'Ivan' },
      },
    },
  },
];

// The same filter that the database query applies (getCallsByTimeRangeWithoutBlockedAndWithCause).
export const EXCLUDED_CAUSES = [31, 38];
export const passesDatabaseFilter = (c: FixtureCall) =>
  c.callerName !== 'Not registered' &&
  c.isBlackListed === false &&
  (c.cause === null || c.cause === undefined || !EXCLUDED_CAUSES.includes(c.cause));
