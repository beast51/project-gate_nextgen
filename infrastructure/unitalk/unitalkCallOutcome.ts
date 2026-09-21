import { CallOutcome } from '@/core/entities/call';

// Unitalk reports the end of a call as a Q.850 release cause. The gate "answers" by dropping the call,
// so the causes that mean a failure for an ordinary call mean "the gate opened" here.
const OUTCOME_BY_CAUSE: Record<number, CallOutcome> = {
  16: 'openedAfterLongWait',
  17: 'opened',
  18: 'openedAfterLongWait',
  19: 'openedRouteUnavailable',
  31: 'connectionFailed',
  38: 'operatorError',
};

// Also used for calls stored before outcomes existed: only the Unitalk codes were stored then
export const unitalkCallOutcome = ({ cause }: { cause?: number | null }): CallOutcome =>
  (cause !== null && cause !== undefined && OUTCOME_BY_CAUSE[cause]) || 'unknown';
