import { AccessEvent, NewAccessEvent } from '../entities/access';
import { ActivityActor } from '../entities/activity';

// Journal of sign ins and opened pages. The records are kept for a limited time, the storage removes old ones.
export type AccessLog = {
  record: (event: NewAccessEvent) => Promise<void>
  // the newest first
  list: (query: { limit: number, actorId?: string }) => Promise<AccessEvent[]>
  listActors: () => Promise<ActivityActor[]>
}
