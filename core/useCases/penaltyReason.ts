import { PassageCall } from '../entities/call';
import { PenaltyReason } from '../entities/penalty';
import { ViolationRules } from '../entities/violation';
import { defaultViolationRules } from './findViolations';
import { listSubjectViolations } from './subjectViolations';

// What an apartment (or a phone) did between `since` and `now`, by the same rules the violations page uses.
// The calls are the calls of that subject.
export const penaltyReasonOf = (
  calls: PassageCall[],
  subjectKey: string,
  since: string,
  now: Date,
  rules: Partial<ViolationRules> = {},
): PenaltyReason => {
  const { limitMinutes } = { ...defaultViolationRules, ...rules };
  const reason: PenaltyReason = { since, overstays: 0, openVisits: 0, overstayMinutes: 0, minutesOverLimit: 0 };

  listSubjectViolations(calls, subjectKey, now, rules)
    // a visit belongs to the period it started in: what happened before `since` was punished already
    .filter(violation => violation.timeIn >= since)
    .forEach(violation => {
      if (violation.kind === 'openVisit') {
        reason.openVisits += 1;
      } else {
        reason.overstays += 1;
        reason.overstayMinutes += violation.minutes ?? 0;
        reason.minutesOverLimit += (violation.minutes ?? 0) - limitMinutes;
      }
    });

  return reason;
};
