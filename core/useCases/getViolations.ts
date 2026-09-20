import { ViolationRules, VisitsOutput } from '../entities/violation';
import { CallsRepository } from '../ports/callsRepository';
import { defaultViolationRules, findViolations } from './findViolations';

type Dependencies = {
  calls: CallsRepository
  refreshCalls: (from: string, to: string) => Promise<void>
  rules?: Partial<ViolationRules>
}

// Shell around findViolations: brings the calls up to date, loads the gate passages and applies the rules
export const createGetViolations = ({ calls, refreshCalls, rules = {} }: Dependencies) =>
  async (from: string, to: string): Promise<VisitsOutput> => {
    await refreshCalls(from, to);

    const appliedRules = { ...defaultViolationRules, ...rules };
    const passages = await calls.findGatePassagesByTimeRange(from, to, appliedRules.failedCauses);

    return findViolations(passages, appliedRules);
  };
