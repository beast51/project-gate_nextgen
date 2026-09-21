import { ViolationRules, VisitsOutput } from '../entities/violation';
import { CallsRepository } from '../ports/callsRepository';
import { findViolations } from './findViolations';

type Dependencies = {
  calls: CallsRepository
  refreshCalls: (from: string, to: string) => Promise<void>
  rules?: Partial<ViolationRules>
  // the wall clock time at the gate; call times are compared with it to tell whether a car is still inside
  now?: () => Date
}

// Shell around findViolations: brings the calls up to date, loads the calls of the period and applies the rules
export const createGetViolations = ({ calls, refreshCalls, rules = {}, now = () => new Date() }: Dependencies) =>
  async (from: string, to: string): Promise<VisitsOutput> => {
    await refreshCalls(from, to);

    // which calls count as a passage through the gate is a rule of findViolations, not of the storage
    return findViolations(await calls.findByTimeRange(from, to), rules, now());
  };
