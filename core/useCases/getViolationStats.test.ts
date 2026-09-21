import { describe, expect, it, vi } from 'vitest';
import { Call } from '../entities/call';
import { createFakeCallsRepository } from './__fixtures__/fakeCallsRepository';
import { createGateClock } from './days';
import { createGetViolationStats } from './getViolationStats';

const call = (time: string, apartmentNumber = '12', number = '380501111111'): Call => ({
  number,
  time,
  apartmentNumber,
  callerName: 'Ivan',
  carNumber: [],
  isBlackListed: false,
  outcome: 'opened',
} as unknown as Call);

// Wednesday, 13 March 2024, 12:00 in Kyiv
const clock = createGateClock('Europe/Kyiv', () => new Date('2024-03-13T10:00:00.000Z'));

describe('getViolationStats', () => {
  it('sums the week, the month and three calendar months around the chosen day', async () => {
    const { repository } = createFakeCallsRepository([
      call('2024-01-05 09:00:00'),                                  // January: an open visit
      call('2024-02-20 09:00:00'), call('2024-02-20 10:30:00'),     // February: an overstay
      call('2024-03-04 09:00:00'),                                  // March, the week before: an open visit
      call('2024-03-12 09:00:00'), call('2024-03-12 10:00:00'),     // this week: an overstay
      call('2023-12-31 09:00:00'),                                  // outside of the three months
    ]);

    const { stats, periods } = await createGetViolationStats({ calls: repository, clock })('2024-03-13');

    expect(periods).toEqual({
      week: ['2024-03-11', '2024-03-17'],
      month: ['2024-03-01', '2024-03-31'],
      threeMonths: ['2024-01-01', '2024-03-31'],
    });
    expect(stats['12']).toEqual({
      week: { overstays: 1, openVisits: 0 },
      month: { overstays: 1, openVisits: 1 },
      threeMonths: { overstays: 2, openVisits: 2 },
    });
  });

  it('judges today by the clock of the gate: a car that has just entered is not a violation yet', async () => {
    const { repository } = createFakeCallsRepository([
      call('2024-03-13 11:40:00'),                                   // 20 minutes ago at the gate
      call('2024-03-13 09:00:00', '7', '380502222222'),              // 3 hours ago: over the limit
    ]);

    const { stats } = await createGetViolationStats({ calls: repository, clock })('2024-03-13');

    expect(stats['12']).toBeUndefined();
    expect(stats['7'].week).toEqual({ overstays: 0, openVisits: 1 });
  });

  it('never asks the telephony and reports the finished days that were not loaded', async () => {
    const { repository, state } = createFakeCallsRepository();
    const claimSync = vi.spyOn(repository, 'claimSync');
    state.filledDays.add('2024-03-11');

    const { coverage } = await createGetViolationStats({ calls: repository, clock })('2024-03-13');

    expect(claimSync).not.toHaveBeenCalled();
    // 1 January .. 12 March are over: 31 + 29 + 12 days, one of them is filled
    expect(coverage.pastDays).toBe(72);
    expect(coverage.missingDays).toHaveLength(71);
    expect(coverage.missingDays).not.toContain('2024-03-11');
    expect(coverage.missingDays).not.toContain('2024-03-13');
  });

  it('has nothing to miss when the calls do not come from a telephony (a demo)', async () => {
    const { repository } = createFakeCallsRepository();

    const { coverage } = await createGetViolationStats({ calls: repository, clock, tracksCoverage: false })('2024-03-13');

    expect(coverage.missingDays).toEqual([]);
  });
});
