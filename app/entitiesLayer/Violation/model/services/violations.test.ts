import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FixtureCall, findViolationsCases, passesDatabaseFilter } from '@/core/useCases/__fixtures__/findViolations.cases';

const state = vi.hoisted(() => ({
  calls: [] as unknown[],
  isTimeToUpdate: false,
  updateCallsData: (async () => {}) as (...args: unknown[]) => unknown,
}));

vi.mock('@/widgetsLayer/Sidebar/actions/getSession', () => ({
  default: async () => ({ user: { email: 'admin@test.dev', name: 'admin' } }),
}));

vi.mock('@/entitiesLayer/Calls/model/services/dbCalls', () => ({
  shotaDatabaseCalls: {
    isTimeToUpdateCalls: async () => state.isTimeToUpdate,
    updateCallsData: (...args: unknown[]) => state.updateCallsData(...args),
    getCallsByTimeRangeWithoutBlockedAndWithCause: async () => state.calls,
    getCallsFromDatabaseByTimeRange: async () => state.calls,
  },
}));

import { findViolations } from './violations';

describe('findViolations (service)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    state.isTimeToUpdate = false;
    state.updateCallsData = vi.fn(async () => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it.each(findViolationsCases)('$name', async ({ now, calls, expected }) => {
    vi.setSystemTime(new Date(now));
    // the database never returns blocked/unregistered/failed calls
    state.calls = (calls as FixtureCall[]).filter(passesDatabaseFilter);

    const result = await findViolations('2024-03-10 00:00:00', '2024-03-10 23:59:59');

    expect(result).toEqual(expected);
  });

  it('starts calls synchronization when it is time to update', async () => {
    vi.setSystemTime(new Date('2024-03-10 12:00:00'));
    state.calls = [];
    state.isTimeToUpdate = true;

    await findViolations('from', 'to');

    expect(state.updateCallsData).toHaveBeenCalledWith('from', 'to');
  });

  it('does not synchronize when the rate limit has not passed', async () => {
    vi.setSystemTime(new Date('2024-03-10 12:00:00'));
    state.calls = [];

    await findViolations('from', 'to');

    expect(state.updateCallsData).not.toHaveBeenCalled();
  });
});
