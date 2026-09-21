import { AccessEvent } from '../../entities/access';
import { ActivityActor } from '../../entities/activity';
import { AccessLog } from '../../ports/accessLog';

// In-memory AccessLog
export const createFakeAccessLog = (stored: AccessEvent[] = []) => {
  const state = { events: [...stored] };

  const log: AccessLog = {
    record: async (event) => { state.events.push({ ...event, id: String(state.events.length + 1) }); },
    list: async ({ limit, actorId }) =>
      [...state.events].reverse().filter(event => !actorId || event.actor.id === actorId).slice(0, limit),
    listActors: async () => {
      const actors = new Map<string, ActivityActor>();
      state.events.forEach(event => actors.set(event.actor.id, event.actor));
      return Array.from(actors.values());
    },
  };

  return { log, state };
};
