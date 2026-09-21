import moment from 'moment-timezone';
import { ActivityActor, NewActivityEvent, SYSTEM_ACTOR, toActivitySubject } from '../../entities/activity';
import { CallOutcome, CallToStore, UNREGISTERED_CALLER_NAME } from '../../entities/call';
import { GateUser } from '../../entities/gateUser';

// Synthetic data of a demo sandbox. Nothing here comes from real customers: the names are generated,
// the phone numbers use the operator code 00 which is not assigned in Ukraine, there are no photos.
// The data is relative to `now`, so a demo always has calls "today", and deterministic for a seed.

const TIME_FORMAT = 'YYYY-MM-DD HH:mm:ss';

const FIRST_NAMES = ['Андрій', 'Олена', 'Тарас', 'Ірина', 'Богдан', 'Наталія', 'Максим', 'Оксана', 'Юрій', 'Світлана', 'Денис', 'Катерина'];
const LAST_NAMES = ['Демченко', 'Зразковий', 'Тестовий', 'Макетний', 'Прикладенко', 'Умовний', 'Показовий', 'Вигаданий', 'Еталонний', 'Пробний'];
const PLATE_REGIONS = ['AA', 'KA', 'BC', 'AE', 'BH', 'AI', 'AX'];
const PLATE_LETTERS = 'ABCEHIKMOPTX';

export type DemoData = {
  gateUsers: GateUser[]
  // oldest first; a call is linked with a gate user by the phone number
  calls: CallToStore[]
  // oldest first: what the owner of the sandbox and the scheduled job "did" before the visitor came
  activity: NewActivityEvent[]
}

// mulberry32: a tiny deterministic generator, the quality is more than enough for demo data
const createRandom = (seed: string) => {
  let state = 0;
  for (const char of seed) state = (Math.imul(state, 31) + char.charCodeAt(0)) | 0;

  const next = () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const int = (min: number, max: number) => min + Math.floor(next() * (max - min + 1));
  const pick = <T>(items: readonly T[] | string) => items[int(0, items.length - 1)] as T;

  return { int, pick };
};

const GATE_USERS_COUNT = 18;
const DAYS_WITH_CALLS = 3;
// before the detailed last days: a quieter history, so the statistics of violations (the week, the month,
// three calendar months) have something to show. Three full months back from any day is at most 123 days.
const DAYS_OF_HISTORY = 125;

const DEMO_ACTOR: ActivityActor = { id: 'demo', name: 'Demo' };

export const generateDemoData = (
  seed: string,
  now: Date,
  timeZone = 'Europe/Kiev',
  actor: ActivityActor = DEMO_ACTOR,
): DemoData => {
  const random = createRandom(seed);
  const current = moment(now).tz(timeZone);
  const format = (time: moment.Moment) => time.format(TIME_FORMAT);

  const gateUsers: GateUser[] = Array.from({ length: GATE_USERS_COUNT }, (_, index) => {
    const phoneNumber = `38000${String(1000000 + index * 37 + random.int(0, 30)).padStart(7, '0')}`;
    const plate = () =>
      `${random.pick(PLATE_REGIONS)}${random.int(1000, 9999)}${random.pick<string>(PLATE_LETTERS)}${random.pick<string>(PLATE_LETTERS)}`;

    return {
      externalId: `demo-${phoneNumber}`,
      name: `${random.pick(LAST_NAMES)} ${random.pick(FIRST_NAMES)}`,
      phoneNumber,
      carNumber: random.int(0, 3) === 0 ? [plate(), plate()] : [plate()],
      // two neighbours share an apartment, one user has no apartment at all
      apartmentNumber: index === 0 ? null : String(index === 2 ? 1 : index),
      image: null,
      additionalImages: [],
      isBlackListed: false,
      blackListedFrom: '',
      blackListedTo: '',
    };
  });

  // an active penalty and an expired one, so the violations management page has something to show and to unblock
  Object.assign(gateUsers[GATE_USERS_COUNT - 1], {
    isBlackListed: true,
    blackListedFrom: format(current.clone().subtract(2, 'days')),
    blackListedTo: format(current.clone().add(5, 'days')),
  });
  Object.assign(gateUsers[GATE_USERS_COUNT - 2], {
    isBlackListed: true,
    blackListedFrom: format(current.clone().subtract(8, 'days')),
    blackListedTo: format(current.clone().subtract(1, 'hours')),
  });

  const calls: CallToStore[] = [];

  const callFrom = (user: GateUser, time: moment.Moment, outcome: CallOutcome = 'opened') => {
    if (time.isAfter(current)) return;

    calls.push({
      number: user.phoneNumber,
      time: format(time),
      callerName: user.name,
      carNumber: user.carNumber,
      apartmentNumber: user.apartmentNumber,
      image: user.image,
      isBlackListed: user.isBlackListed,
      blackListedFrom: user.blackListedFrom,
      blackListedTo: user.blackListedTo,
      secondsFullTime: random.int(3, 9),
      outcome,
    });
  };

  const residents = gateUsers.filter(user => !user.isBlackListed && user.apartmentNumber !== '1');

  for (let daysAgo = DAYS_OF_HISTORY; daysAgo >= DAYS_WITH_CALLS; daysAgo--) {
    const day = current.clone().subtract(daysAgo, 'days').startOf('day');

    residents.forEach((resident, index) => {
      if (random.int(0, 2) === 0) return;

      const entry = day.clone().add(7 * 60 + random.int(0, 12 * 60), 'minutes').add(random.int(0, 59), 'seconds');
      // some residents break the rules now and then, most of them never
      const careless = index % 4 === 0;
      const luck = random.int(0, 99);

      callFrom(resident, entry);
      // entered and the exit was never recorded
      if (careless && luck < 4) return;
      callFrom(resident, entry.clone().add(careless && luck < 16 ? random.int(50, 180) : random.int(5, 40), 'minutes'));
    });
  }

  for (let daysAgo = DAYS_WITH_CALLS - 1; daysAgo >= 0; daysAgo--) {
    const day = current.clone().subtract(daysAgo, 'days').startOf('day');

    // one visit per resident a day: visits of one apartment must not overlap
    residents.forEach((resident, index) => {
      if (random.int(0, 2) === 0) return;

      const entry = day.clone().add(7 * 60 + random.int(0, 12 * 60), 'minutes').add(random.int(0, 59), 'seconds');
      const overstays = index % 4 === 0;
      const exit = entry.clone().add(overstays ? random.int(50, 180) : random.int(5, 40), 'minutes');

      callFrom(resident, entry);
      // people often redial when the gate is slow
      if (index % 5 === 0) callFrom(resident, entry.clone().add(30, 'seconds'), 'openedAfterLongWait');
      callFrom(resident, exit);
    });

    callFrom(residents[1], day.clone().add(6, 'hours').add(40, 'minutes'), 'connectionFailed');
    callFrom(gateUsers[GATE_USERS_COUNT - 1], day.clone().add(8, 'hours').add(15, 'minutes'));
    callFrom(
      { ...gateUsers[0], phoneNumber: '380009999999', name: UNREGISTERED_CALLER_NAME, carNumber: [], apartmentNumber: null },
      day.clone().add(9, 'hours').add(5, 'minutes'),
    );
  }

  // a car that entered more than an hour ago and is still inside
  callFrom(gateUsers[1], current.clone().subtract(70, 'minutes'));

  calls.sort((a, b) => a.time.localeCompare(b.time));

  const blocked = gateUsers[GATE_USERS_COUNT - 1];
  const penaltyExpired = gateUsers[GATE_USERS_COUNT - 2];
  const event = (ago: [number, moment.unitOfTime.DurationConstructor], by: ActivityActor, action: NewActivityEvent['action'], subjects: GateUser[], details: NewActivityEvent['details'] = {}): NewActivityEvent => ({
    at: current.clone().subtract(...ago).toISOString(),
    actor: by,
    action,
    subjects: subjects.map(toActivitySubject),
    details,
  });

  const activity = [
    event([9, 'days'], actor, 'gateUsersImported', [], { received: GATE_USERS_COUNT, added: GATE_USERS_COUNT, skipped: 0 }),
    event([8, 'days'], actor, 'gateUserBlocked', [penaltyExpired], { blockedUntil: penaltyExpired.blackListedTo, changedFields: [] }),
    event([3, 'days'], actor, 'gateUserChanged', [gateUsers[3]], { changedFields: ['carNumber'] }),
    event([2, 'days'], actor, 'gateUserBlocked', [blocked], { blockedUntil: blocked.blackListedTo, changedFields: [] }),
    event([1, 'days'], SYSTEM_ACTOR, 'expiredPenaltiesUnblocked', [gateUsers[4], gateUsers[5]]),
    event([5, 'hours'], actor, 'gateUserAdded', [gateUsers[6]]),
  ];

  return { gateUsers, calls, activity };
};
