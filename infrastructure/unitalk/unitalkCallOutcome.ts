import { CallOutcome } from '@/core/entities/call';

// How the gate behind Unitalk answers. The controller of the gate does not pick the call up: it opens and drops
// the call, which the telephony reports as "busy". Everything else means the gate did not open: the call rang out
// unanswered (NOANSWER, also what a blocked caller gets), the caller gave up, there was no money on the account.
// The rule comes from the operators of the gate and was checked on the production calls of 2026.
//
// The duration is deliberately not a part of it. A "busy" usually comes within 4-6 seconds, but the slower ones
// (7-9 s, 1.7% of them) are passages too: they have their entry/exit partner the same day, and dropping one
// shifts every following pair of that apartment into false violations.
const OPENED_CAUSE = 17;
const OPENED_STATE = 'BUSY';

// A number without the right to open the gate is turned away immediately: "no answer" after zero seconds.
// 96% of the calls that carry the "blocked from .. until" note of 2026 ended exactly like this.
const REFUSED = { cause: 16, state: 'NOANSWER', seconds: 0 };

const OUTCOME_BY_FAILURE_CAUSE: Record<number, CallOutcome> = {
  31: 'connectionFailed',
  38: 'operatorError',
};

type UnitalkCodes = { cause?: number | null, state?: string | null, secondsFullTime?: number | null }

// Also applied to stored calls when they are read: they keep the raw codes, so a corrected rule
// corrects the history too
export const unitalkCallOutcome = ({ cause, state, secondsFullTime }: UnitalkCodes): CallOutcome => {
  if (cause !== null && cause !== undefined && OUTCOME_BY_FAILURE_CAUSE[cause]) return OUTCOME_BY_FAILURE_CAUSE[cause];

  if (cause === REFUSED.cause && state === REFUSED.state && secondsFullTime === REFUSED.seconds) return 'refused';

  // old records may lack the state: the cause alone decides then
  const isBusy = cause === OPENED_CAUSE && (state === null || state === undefined || state === OPENED_STATE);

  return isBusy ? 'opened' : 'notOpened';
};
