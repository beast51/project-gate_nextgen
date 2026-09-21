import { AccessEvent, NewAccessEvent } from '../entities/access';
import { ActivityActor } from '../entities/activity';

// Journal of sign ins and opened pages. The records are kept for a limited time, the storage removes old ones.
import { Period } from '../useCases/period';

export type AccessLog = {
  record: (event: NewAccessEvent) => Promise<void>
  // the newest first
  list: (query: { limit: number, actorId?: string, period?: Period }) => Promise<AccessEvent[]>
  listActors: () => Promise<ActivityActor[]>
}
