import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { findViolationsCases } from './__fixtures__/findViolations.cases';
import { createFakeCallsRepository } from './__fixtures__/fakeCallsRepository';
import { createGetViolations } from './getViolations';

const FROM = '2024-03-10 00:00:00';
const TO = '2024-03-10 23:59:59';

describe('getViolations', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  // the same characterization cases that were recorded against the legacy service
  it.each(findViolationsCases)('$name', async ({ now, calls, expected }) => {
    vi.setSystemTime(new Date(now));
    const { repository } = createFakeCallsRepository(calls);

    const getViolations = createGetViolations({ calls: repository, refreshCalls: async () => {} });

    expect(await getViolations(FROM, TO)).toEqual(expected);
  });

  it('brings the calls up to date before reading them', async () => {
    vi.setSystemTime(new Date('2024-03-10 12:00:00'));
    const { repository, state } = createFakeCallsRepository([]);
    const refreshCalls = vi.fn(async () => {
      state.calls.push(findViolationsCases[1].calls[0]);
    });

    const result = await createGetViolations({ calls: repository, refreshCalls })(FROM, TO);

    expect(refreshCalls).toHaveBeenCalledWith(FROM, TO);
    expect(Object.keys(result)).toEqual(['12']);
  });

  it('ignores calls outside of the requested period', async () => {
    vi.setSystemTime(new Date('2024-03-10 12:00:00'));
    const { repository } = createFakeCallsRepository(findViolationsCases[1].calls);

    const result = await createGetViolations({ calls: repository, refreshCalls: async () => {} })(
      '2024-03-11 00:00:00',
      '2024-03-11 23:59:59',
    );

    expect(result).toEqual({});
  });
});
