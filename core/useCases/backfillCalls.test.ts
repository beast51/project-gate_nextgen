import { describe, expect, it, vi } from 'vitest';
import { createFakeCallsRepository } from './__fixtures__/fakeCallsRepository';
import { createBackfillCalls } from './backfillCalls';

const today = () => '2024-03-10';

describe('backfillCalls (gentle loading of the history)', () => {
  it('fills one day per step, the newest first, and stops at yesterday', async () => {
    const { repository, state } = createFakeCallsRepository();
    const syncCalls = vi.fn(async () => 4);
    let clock = new Date('2024-03-10T12:00:00.000Z').getTime();
    const backfill = createBackfillCalls({ calls: repository, syncCalls, today, now: () => new Date(clock += 10_000) });

    expect(await backfill.fillNextDay('2024-03-08', '2024-03-12'))
      .toEqual({ status: 'filled', day: '2024-03-09', added: 4, remaining: 1 });
    expect(syncCalls).toHaveBeenLastCalledWith('2024-03-09 00:00:00', '2024-03-09 23:59:59');

    expect(await backfill.fillNextDay('2024-03-08', '2024-03-12'))
      .toEqual({ status: 'filled', day: '2024-03-08', added: 4, remaining: 0 });
    expect(await backfill.fillNextDay('2024-03-08', '2024-03-12')).toEqual({ status: 'done' });

    expect(syncCalls).toHaveBeenCalledTimes(2);
    expect(Array.from(state.filledDays).sort()).toEqual(['2024-03-08', '2024-03-09']);
  });

  it('shares the rate limit with the operators: steps back when the telephony was just used', async () => {
    const { repository, state } = createFakeCallsRepository([], new Date('2024-03-10T12:00:00.000Z'));
    const syncCalls = vi.fn(async () => 0);
    const backfill = createBackfillCalls({
      calls: repository, syncCalls, today, now: () => new Date('2024-03-10T12:00:02.000Z'),
    });

    expect(await backfill.fillNextDay('2024-03-09', '2024-03-09')).toEqual({ status: 'rateLimited', remaining: 1 });
    expect(syncCalls).not.toHaveBeenCalled();
    expect(state.filledDays.size).toBe(0);
  });

  it('leaves the day pending when the telephony fails', async () => {
    const { repository } = createFakeCallsRepository();
    const backfill = createBackfillCalls({
      calls: repository, syncCalls: async () => { throw new Error('telephony is down'); }, today,
    });

    await expect(backfill.fillNextDay('2024-03-09', '2024-03-09')).rejects.toThrow('telephony is down');
    expect(await backfill.pendingDays('2024-03-09', '2024-03-09')).toEqual(['2024-03-09']);
  });

  it('rejects what is not a period of days', async () => {
    const { repository } = createFakeCallsRepository();
    const backfill = createBackfillCalls({ calls: repository, syncCalls: async () => 0, today });

    await expect(backfill.pendingDays('2024-03-09', '2024-03-01')).rejects.toThrow();
    await expect(backfill.pendingDays('yesterday', '2024-03-01')).rejects.toThrow();
  });
});
