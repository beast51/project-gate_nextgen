import moment from 'moment-timezone';
import { CallToStore, UNREGISTERED_CALLER_NAME } from '../../entities/call';
import { GateUser } from '../../entities/gateUser';

// Synthetic data of a demo sandbox. Nothing here comes from real customers: the names are generated,
// the phone numbers use the operator code 00 which is not assigned in Ukraine, there are no photos.
// The data is relative to `now`, so a demo always has calls "today", and deterministic for a seed.

const TIME_FORMAT = 'YYYY-MM-DD HH:mm:ss';

const FIRST_NAMES = ['Андрій', 'Олена', 'Тарас', 'Ірина', 'Богдан', 'Наталія', 'Максим', 'Оксана', 'Юрій', 'Світлана', 'Денис', 'Катерина'];
const LAST_NAMES = ['Демченко', 'Зразковий', 'Тестовий', 'Макетний', 'Прикладенко', 'Умовний', 'Показовий', 'Вигаданий', 'Еталонний', 'Пробний'];
const PLATE_REGIONS = ['AA', 'KA', 'BC', 'AE', 'BH', 'AI', 'AX'];
const PLATE_LETTERS = 'ABCEHIKMOPTX';

const GATE_OPENED = { cause: 17, state: 'BUSY' };
const CONNECTION_FAILED = { cause: 31, state: 'NOANSWER' };

export type DemoData = {
  gateUsers: GateUser[]
  // oldest first; a call is linked with a gate user by the phone number
  calls: CallToStore[]
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

export const generateDemoData = (seed: string, now: Date, timeZone = 'Europe/Kiev'): DemoData => {
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

  const callFrom = (user: GateUser, time: moment.Moment, outcome = GATE_OPENED) => {
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
      ...outcome,
    });
  };

  const residents = gateUsers.filter(user => !user.isBlackListed && user.apartmentNumber !== '1');

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
      if (index % 5 === 0) callFrom(resident, entry.clone().add(30, 'seconds'));
      callFrom(resident, exit);
    });

    callFrom(residents[1], day.clone().add(6, 'hours').add(40, 'minutes'), CONNECTION_FAILED);
    callFrom(gateUsers[GATE_USERS_COUNT - 1], day.clone().add(8, 'hours').add(15, 'minutes'));
    callFrom(
      { ...gateUsers[0], phoneNumber: '380009999999', name: UNREGISTERED_CALLER_NAME, carNumber: [], apartmentNumber: null },
      day.clone().add(9, 'hours').add(5, 'minutes'),
    );
  }

  // a car that entered more than an hour ago and is still inside
  callFrom(gateUsers[1], current.clone().subtract(70, 'minutes'));

  calls.sort((a, b) => a.time.localeCompare(b.time));

  return { gateUsers, calls };
};
