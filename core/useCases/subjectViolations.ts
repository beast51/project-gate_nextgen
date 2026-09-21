import moment from 'moment';
import { PassageCall } from '../entities/call';
import { SubjectViolation, ViolationRules } from '../entities/violation';
import { defaultViolationRules, listVisits } from './findViolations';
import { dayOf } from './violationStats';

const FAR_FUTURE = new Date(8640000000000000);

// The violations of one apartment (or phone), oldest first, by the same rules the violations page uses: every
// calendar day is judged on its own, a finished day as finished, today by `now` (the clock of the gate).
// Give it all the calls of the period to get exactly what the violations page shows for every day: redials are
// recognized among neighbouring calls, whoever made them.
export const listSubjectViolations = (
  calls: PassageCall[],
  subjectKey: string,
  now: Date,
  rules: Partial<ViolationRules> = {},
): SubjectViolation[] => {
  const { limitMinutes } = { ...defaultViolationRules, ...rules };
  const today = moment(now).format('YYYY-MM-DD');

  const callsByDay = new Map<string, PassageCall[]>();
  [...calls]
    .sort((a, b) => a.time.localeCompare(b.time))
    .forEach(call => callsByDay.set(dayOf(call.time), [...(callsByDay.get(dayOf(call.time)) ?? []), call]));

  const violations: SubjectViolation[] = [];

  callsByDay.forEach((dayCalls, day) => {
    const visits = listVisits(dayCalls, rules, day < today ? FAR_FUTURE : now)[subjectKey] ?? [];

    visits.forEach(visit => {
      if (visit.timeOut === null) {
        // an entry of today is a violation only after the limit has passed
        if (visit.violation !== '') violations.push({ day, timeIn: visit.timeIn, timeOut: null, minutes: null, kind: 'openVisit' });
      } else if (visit.violationTime !== null && visit.violationTime >= limitMinutes) {
        violations.push({ day, timeIn: visit.timeIn, timeOut: String(visit.timeOut), minutes: visit.violationTime, kind: 'overstay' });
      }
    });
  });

  return violations;
};
