import moment from 'moment';
import { PassageCall } from '../entities/call';
import { PenaltyReason } from '../entities/penalty';
import { ViolationRules } from '../entities/violation';
import { defaultViolationRules, listVisits } from './findViolations';
import { dayOf } from './violationStats';

const FAR_FUTURE = new Date(8640000000000000);

// What an apartment (or a phone) did between `since` and `now`, by the same rules the violations page uses:
// every calendar day is judged on its own, a finished day as finished. The calls are the calls of that subject.
export const penaltyReasonOf = (
  calls: PassageCall[],
  subjectKey: string,
  since: string,
  now: Date,
  rules: Partial<ViolationRules> = {},
): PenaltyReason => {
  const { limitMinutes } = { ...defaultViolationRules, ...rules };
  const today = moment(now).format('YYYY-MM-DD');
  const reason: PenaltyReason = { since, overstays: 0, openVisits: 0, overstayMinutes: 0, minutesOverLimit: 0 };

  const callsByDay = new Map<string, PassageCall[]>();
  [...calls]
    .sort((a, b) => a.time.localeCompare(b.time))
    .forEach(call => callsByDay.set(dayOf(call.time), [...(callsByDay.get(dayOf(call.time)) ?? []), call]));

  callsByDay.forEach((dayCalls, day) => {
    const visits = listVisits(dayCalls, rules, day < today ? FAR_FUTURE : now)[subjectKey] ?? [];

    visits
      // a visit belongs to the period it started in: what happened before `since` was punished already
      .filter(visit => visit.timeIn >= since)
      .forEach(visit => {
        if (visit.timeOut === null) {
          if (visit.violation !== '') reason.openVisits += 1;
        } else if (visit.violationTime !== null && visit.violationTime >= limitMinutes) {
          reason.overstays += 1;
          reason.overstayMinutes += visit.violationTime;
          reason.minutesOverLimit += visit.violationTime - limitMinutes;
        }
      });
  });

  return reason;
};
