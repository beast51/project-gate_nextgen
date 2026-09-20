import { Call } from '../entities/call';
import { CallsRepository } from '../ports/callsRepository';

type Dependencies = {
  calls: CallsRepository
  refreshCalls: (from: string, to: string) => Promise<void>
}

// Calls of the period, the newest first
export const createGetCalls = ({ calls, refreshCalls }: Dependencies) =>
  async (from: string, to: string): Promise<Call[]> => {
    await refreshCalls(from, to);

    const found = await calls.findByTimeRange(from, to);

    return found.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
  };
