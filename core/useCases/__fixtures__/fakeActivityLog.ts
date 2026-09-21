import { ActivityActor, ActivityEvent, NewActivityEvent } from '../../entities/activity';
import { ActivityLog } from '../../ports/activityLog';
import { createRecordActivity, RecordActivity } from '../activity';

// for tests that are not about the journal
export const noActivity: RecordActivity = async () => {};

// In-memory ActivityLog
export const createFakeActivityLog = (stored: ActivityEvent[] = []) => {
  const state = { events: [...stored] };

  const log: ActivityLog = {
    record: async (event: NewActivityEvent) => {
      state.events.push({ ...event, id: String(state.events.length + 1) });
    },
    list: async ({ limit, actorId }) =>
      [...state.events]
        .reverse()
        .filter(event => !actorId || event.actor.id === actorId)
        .slice(0, limit),
    listActors: async () => {
      const actors = new Map<string, ActivityActor>();
      state.events.forEach(event => actors.set(event.actor.id, event.actor));
      return Array.from(actors.values());
    },
  };

  return { log, state };
};

export const createFakeActivity = (actor: ActivityActor = { id: 'account-1', name: 'Operator' }, now = () => new Date('2024-03-10T12:00:00.000Z')) => {
  const { log, state } = createFakeActivityLog();
  return { log, state, recordActivity: createRecordActivity({ log, actor, now }) };
};
