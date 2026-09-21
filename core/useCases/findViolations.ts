import moment from 'moment';
import { Call, isPassageOutcome, PassageCall, UNREGISTERED_CALLER_NAME } from '../entities/call';
import { ApartmentVisitor, PhoneVisitor, VisitInfo, ViolationCounts, ViolationRules, VisitsOutput } from '../entities/violation';

const TIME_FORMAT = 'YYYY-MM-DD HH:mm:ss';

export const defaultViolationRules: ViolationRules = {
  limitMinutes: 45,
  longestVisitMinutes: 150,
  secondsBetweenTwoCalls: 118,
  pairedCallWindowMinutes: 2,
};

type Visits<Visitor> = Record<string, { time: string[], details: Visitor | null }>

const parseTime = (time: string) => moment(time, TIME_FORMAT).valueOf();

// Only calls that really opened the gate for a known and not blocked user take part in the calculation
export const isGatePassage = (call: PassageCall) =>
  call.callerName !== UNREGISTERED_CALLER_NAME &&
  call.isBlackListed === false &&
  isPassageOutcome(call.outcome);

const isRedial = (call: PassageCall, previousCall: PassageCall, rules: ViolationRules) => {
  const difference = Math.abs(new Date(call.time).getTime() - new Date(previousCall.time).getTime());
  const differenceInMinutes = difference / (1000 * 60);
  return call.number === previousCall.number && !(differenceInMinutes > rules.pairedCallWindowMinutes);
};

// A call is dropped when one of the two previous calls is a redial from the same number.
const withoutRedials = <T extends PassageCall>(calls: T[], rules: ViolationRules) =>
  calls.filter((call, index) => {
    if (index < 2) return true; // Always include the first two calls in the array.
    const previousCalls = [calls[index - 1], calls[index - 2]];
    return !previousCalls.some(previousCall => isRedial(call, previousCall, rules));
  });

// The time is added only when enough seconds have passed since the previous passage of the same visitor
const addPassage = (times: string[], time: string, rules: ViolationRules) => {
  const timeOfLastPassage = times[times.length - 1];

  if (timeOfLastPassage) {
    const diffInSeconds = Math.abs(parseTime(time) - parseTime(timeOfLastPassage)) / 1000;
    if (diffInSeconds > rules.secondsBetweenTwoCalls) {
      times.push(time);
    }
  } else {
    times.push(time);
  }
};

const groupByApartment = (calls: PassageCall[], rules: ViolationRules) => {
  const grouped: Visits<ApartmentVisitor> = {};
  const callsWithoutApartment: PassageCall[] = [];

  for (const call of calls) {
    const apartmentNumber = call.apartmentNumber;

    if (!apartmentNumber) {
      callsWithoutApartment.push(call);
      continue;
    }

    if (!grouped[apartmentNumber]) {
      grouped[apartmentNumber] = { time: [], details: null };
    }

    const visitor = grouped[apartmentNumber].details;

    if (!visitor) {
      grouped[apartmentNumber].details = {
        number: [call.number],
        carNumber: call.carNumber ?? [],
        image: call.image,
        name: call.callerName,
      };
    } else if (!visitor.number.includes(call.number)) {
      visitor.number.push(call.number);
    }

    addPassage(grouped[apartmentNumber].time, call.time, rules);
  }

  return { grouped, callsWithoutApartment };
};

const groupByPhoneNumber = (calls: PassageCall[], rules: ViolationRules) => {
  const grouped: Visits<PhoneVisitor> = {};

  for (const call of calls) {
    if (!grouped[call.number]) {
      grouped[call.number] = { time: [], details: null };
    }
    if (!grouped[call.number].details) {
      grouped[call.number].details = {
        carNumber: call.carNumber ?? [],
        image: call.image,
        apartmentNumber: call.apartmentNumber,
        name: call.callerName,
      };
    }

    addPassage(grouped[call.number].time, call.time, rules);
  }

  return grouped;
};

const minutesBetween = (from: string, to: string) =>
  Math.floor((new Date(to).getTime() - new Date(from).getTime()) / (1000 * 60));

// Passages go in pairs: entry, exit, entry, exit... But a car that gets in or out behind somebody else, without
// a call ("a train"), leaves a passage without a pair, and pairs made simply in order are shifted by it for the
// rest of the day: a visit of 9 minutes in the evening turned into "parked for 449 minutes".
//
// The day is read the most plausible way instead. Every passage is either a train or the beginning of a visit
// that the next passage ends; two passages `longestVisitMinutes` apart or more are never one visit. Of all such
// readings the one with the fewest violations wins (a train is one, an overstay is one), then the one with the
// fewest minutes inside: 95% of ordinary visits are shorter than the limit, their median is 12 minutes.
// Of equal readings the later passages are the trains, as it was when the last one was simply left alone.
// Returns the indexes of the passages without a pair.
export const unpairedPassages = (times: string[], rules: ViolationRules): number[] => {
  type Reading = { violations: number, minutes: number, isTrain: boolean };
  const count = times.length;
  // best[i]: the best reading of the passages from i to the end of the day
  const best: Reading[] = new Array(count + 2);
  best[count] = { violations: 0, minutes: 0, isTrain: false };
  best[count + 1] = { violations: Infinity, minutes: Infinity, isTrain: false };

  for (let i = count - 1; i >= 0; i--) {
    const asTrain: Reading = { violations: best[i + 1].violations + 1, minutes: best[i + 1].minutes, isTrain: true };
    let reading = asTrain;

    if (i + 1 < count) {
      const duration = minutesBetween(times[i], times[i + 1]);

      if (duration < rules.longestVisitMinutes) {
        const asVisit: Reading = {
          violations: best[i + 2].violations + (duration >= rules.limitMinutes ? 1 : 0),
          minutes: best[i + 2].minutes + duration,
          isTrain: false,
        };
        const isBetter = asVisit.violations < asTrain.violations
          || (asVisit.violations === asTrain.violations && asVisit.minutes <= asTrain.minutes);

        if (isBetter) reading = asVisit;
      }
    }

    best[i] = reading;
  }

  const trains: number[] = [];
  for (let i = 0; i < count;) {
    if (best[i].isTrain) { trains.push(i); i += 1; } else i += 2;
  }
  return trains;
};

const toVisits = (times: string[], rules: ViolationRules, now: Date) => {
  // a car stayed longer than the limit / a car entered and its exit was never seen
  const counts: ViolationCounts = { overstays: 0, openVisits: 0 };
  const visits: VisitInfo[] = [];
  const unpaired = new Set(unpairedPassages(times, rules));

  for (let i = 0; i < times.length;) {
    const isUnpaired = unpaired.has(i);
    const inTime = new Date(times[i]);
    const outTime = isUnpaired ? null : new Date(times[i + 1]);
    const visit: VisitInfo = {
      timeIn: moment(inTime).format(TIME_FORMAT),
      timeOut: null,
      thisVisitTime: null,
      violationTime: null,
      violation: '',
    };

    // If there was no exit, we consider it a violation.
    if (!outTime && (now.getTime() - inTime.getTime()) / (1000 * 60) >= rules.limitMinutes) {
      visit.violation = 'still parked or train';
      counts.openVisits++;
    } else if (outTime) {
      visit.timeOut = moment(outTime).format(TIME_FORMAT);
      // If the time difference is greater than or equal to the limit, we consider it a violation.
      const differenceInMinutes = minutesBetween(times[i], times[i + 1]);
      visit.violationTime = differenceInMinutes;
      if (differenceInMinutes >= rules.limitMinutes) {
        visit.violation = `has been parked for ${differenceInMinutes} minutes`;
        counts.overstays++;
      } else {
        visit.violation = 'no violation';
      }
    }

    visits.push(visit);
    i += isUnpaired ? 1 : 2;
  }

  return { visits, counts, violationCount: counts.overstays + counts.openVisits };
};

// calls -> passages through the gate, grouped by the apartment or, without an apartment, by the phone number
const groupPassages = (calls: PassageCall[], rules: ViolationRules) => {
  const passages = withoutRedials(calls.filter(isGatePassage), rules);
  const { grouped: byApartment, callsWithoutApartment } = groupByApartment(passages, rules);
  const byPhoneNumber = groupByPhoneNumber(callsWithoutApartment, rules);

  return { byApartment, byPhoneNumber };
};

// The same rules, only the numbers: how many violations of each kind every apartment (or phone) has.
// The calls must belong to ONE calendar day, see countViolationsByDay.
export const countViolations = (
  calls: PassageCall[],
  rules: Partial<ViolationRules> = {},
  now: Date = new Date(),
): Record<string, ViolationCounts> => {
  const appliedRules: ViolationRules = { ...defaultViolationRules, ...rules };
  const { byApartment, byPhoneNumber } = groupPassages(calls, appliedRules);

  return Object.fromEntries(
    Object.entries({ ...byApartment, ...byPhoneNumber }).map(([key, { time }]) => [key, toVisits(time, appliedRules, now).counts]),
  );
};

// The visits themselves, for whoever needs more than the numbers. The calls must belong to ONE calendar day.
export const listVisits = (
  calls: PassageCall[],
  rules: Partial<ViolationRules> = {},
  now: Date = new Date(),
): Record<string, VisitInfo[]> => {
  const appliedRules: ViolationRules = { ...defaultViolationRules, ...rules };
  const { byApartment, byPhoneNumber } = groupPassages(calls, appliedRules);

  return Object.fromEntries(
    Object.entries({ ...byApartment, ...byPhoneNumber }).map(([key, { time }]) => [key, toVisits(time, appliedRules, now).visits]),
  );
};

export const findViolations = (
  calls: Call[],
  rules: Partial<ViolationRules> = {},
  now: Date = new Date(),
): VisitsOutput => {
  const appliedRules: ViolationRules = { ...defaultViolationRules, ...rules };
  const { byApartment, byPhoneNumber } = groupPassages(calls, appliedRules);

  const result: VisitsOutput = {};

  for (const [key, { time, details }] of Object.entries({ ...byApartment, ...byPhoneNumber })) {
    const { visits, violationCount } = toVisits(time, appliedRules, now);

    result[key] = {
      visitCount: Math.ceil(time.length / 2),
      violationCount,
      visits,
      aboutUser: details!,
    };
  }

  return result;
};
