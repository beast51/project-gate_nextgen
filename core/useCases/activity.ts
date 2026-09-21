import { ActivityAction, ActivityActor, ActivityDetails, ActivitySubject, toActivitySubject } from '../entities/activity';
import { ActivityLog } from '../ports/activityLog';
import { parsePeriod } from './period';

export type RecordActivity = (action: ActivityAction, subjects: ActivitySubject[], details?: ActivityDetails) => Promise<void>

type Dependencies = {
  log: ActivityLog
  actor: ActivityActor
  now?: () => Date
}

// What use cases call to leave a record. The journal is an operational aid, not a transaction log:
// a record that could not be written must never undo or fail the action of the operator.
export const createRecordActivity = ({ log, actor, now = () => new Date() }: Dependencies): RecordActivity =>
  async (action, subjects, details = {}) => {
    try {
      await log.record({
        at: now().toISOString(),
        actor,
        action,
        subjects: subjects.map(toActivitySubject),
        details,
      });
    } catch (error) {
      console.error(`Failed to record the activity "${action}"`, error);
    }
  };

export const DEFAULT_ACTIVITY_LIMIT = 10;
const MAX_ACTIVITY_LIMIT = 100;

export const createGetActivity = ({ log }: { log: ActivityLog }) =>
  (query: { limit?: number, actorId?: string, from?: unknown, to?: unknown } = {}) => {
    const period = parsePeriod(query.from, query.to);
    // the latest records by default; a chosen day shows everything that happened that day
    const limit = query.limit || (period ? MAX_ACTIVITY_LIMIT : DEFAULT_ACTIVITY_LIMIT);

    return log.list({
      limit: Math.min(Math.max(Math.trunc(limit), 1), MAX_ACTIVITY_LIMIT),
      actorId: query.actorId || undefined,
      period,
    });
  };
