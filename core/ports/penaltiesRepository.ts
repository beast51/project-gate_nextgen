import { NewPenalty, Penalty } from '../entities/penalty';

export type PenaltyChanges = Partial<Pick<Penalty, 'phoneNumbers' | 'until' | 'lifted'>>

export type PenaltiesRepository = {
  add: (penalty: NewPenalty) => Promise<void>
  update: (id: string, changes: PenaltyChanges) => Promise<void>
  // penalties of an apartment (or a phone), the newest first
  listBySubject: (subjectKey: string) => Promise<Penalty[]>
  // penalties that started in the period; 'YYYY-MM-DD HH:mm:ss', both included
  listStartedBetween: (from: string, to: string) => Promise<Penalty[]>
}
