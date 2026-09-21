import { ActivityActor, ActivityEvent, NewActivityEvent } from '../entities/activity';

// Journal of what the operators (and the scheduled jobs) did with the gate users
import { Period } from '../useCases/period';

export type ActivityLog = {
  record: (event: NewActivityEvent) => Promise<void>
  // the newest first
  list: (query: { limit: number, actorId?: string, period?: Period }) => Promise<ActivityEvent[]>
  // everybody who has at least one record
  listActors: () => Promise<ActivityActor[]>
}
