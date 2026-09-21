import { afterEach, describe, expect, it, vi } from 'vitest';
import { isFailedOutcome } from '@/core/entities/call';
import { unitalkCallOutcome } from './unitalkCallOutcome';
import { createUnitalkCallsSource } from './unitalkCallsSource';

const config = {
  url: 'https://telephony.example',
  authorization: 'contacts-key',
  internalApiAuthorization: 'history-key',
  projectId: 'project',
  canOpenGatesResponsibleId: '1',
};

describe('unitalkCallOutcome', () => {
  // every cause value that exists in the production database (2023-05 .. 2026-09), plus "nothing reported"
  const STORED_CAUSES = [17, 16, 19, 31, 3, 18, 27, 34, 38, 127, 102, 41, null, undefined];

  // the rule before outcomes existed: a call is not a passage through the gate only for causes 31 and 38
  const wasFailureBefore = (cause: number | null | undefined) => cause === 31 || cause === 38;

  it.each(STORED_CAUSES)('keeps the old meaning of cause %s', (cause) => {
    expect(isFailedOutcome(unitalkCallOutcome({ cause }))).toBe(wasFailureBefore(cause));
  });

  it('names the outcomes the operators know', () => {
    expect(unitalkCallOutcome({ cause: 17 })).toBe('opened');
    expect(unitalkCallOutcome({ cause: 16 })).toBe('openedAfterLongWait');
    expect(unitalkCallOutcome({ cause: 18 })).toBe('openedAfterLongWait');
    expect(unitalkCallOutcome({ cause: 19 })).toBe('openedRouteUnavailable');
    expect(unitalkCallOutcome({ cause: 31 })).toBe('connectionFailed');
    expect(unitalkCallOutcome({ cause: 38 })).toBe('operatorError');
    expect(unitalkCallOutcome({ cause: 127 })).toBe('unknown');
    expect(unitalkCallOutcome({})).toBe('unknown');
  });
});

describe('unitalkCallsSource', () => {
  afterEach(() => vi.unstubAllGlobals());

  const historyCall = (index: number) => ({
    from: `38050${String(index).padStart(7, '0')}`,
    // newest first, like Unitalk answers
    date: `2024-03-${String(28 - Math.floor(index / 100)).padStart(2, '0')} 10:00:00`,
    secondsFullTime: 5,
    cause: 17,
    state: 'BUSY',
  });

  const stubHistory = (total: number) => {
    const all = Array.from({ length: total }, (_, index) => historyCall(index));
    const send = vi.fn(async (_url: string, init: { body: string }) => {
      const { limit, offset } = JSON.parse(init.body);
      return new Response(JSON.stringify({ count: total, calls: all.slice(offset, offset + limit), warning: null }));
    });
    vi.stubGlobal('fetch', send);
    return send;
  };

  it('asks once when everything fits into one page', async () => {
    const send = stubHistory(115);

    const calls = await createUnitalkCallsSource(config).getCalls('2024-03-01 00:00:00', '2024-03-28 23:59:59');

    expect(send).toHaveBeenCalledTimes(1);
    expect(calls).toHaveLength(115);
    expect(calls[0].outcome).toBe('opened');
  });

  // regression: a period with more than 1000 calls was cut without any sign of it
  it('loads a long period page by page, oldest first', async () => {
    const send = stubHistory(2500);

    const calls = await createUnitalkCallsSource(config).getCalls('2024-03-01 00:00:00', '2024-03-28 23:59:59');

    expect(send.mock.calls.map(([, init]) => JSON.parse(init.body).offset)).toEqual([0, 1000, 2000]);
    expect(calls).toHaveLength(2500);
    expect(new Set(calls.map(call => call.number)).size).toBe(2500);
    expect(calls[0].time <= calls[calls.length - 1].time).toBe(true);
  });

  it('stops after 10 pages, the rest is loaded by the next synchronizations', async () => {
    const send = stubHistory(25000);

    const calls = await createUnitalkCallsSource(config).getCalls('2023-01-01 00:00:00', '2024-03-28 23:59:59');

    expect(send).toHaveBeenCalledTimes(10);
    expect(calls).toHaveLength(10000);
  });

  it('uses the key of the history API and strips quotes from the dates', async () => {
    const send = stubHistory(0);

    await createUnitalkCallsSource(config).getCalls('"2024-03-10 00:00:00"', '"2024-03-10 23:59:59"');

    const [url, init] = send.mock.calls[0] as unknown as [string, { headers: Record<string, string>, body: string }];
    expect(url).toBe('https://telephony.example/api/history/get');
    expect(init.headers.Authorization).toBe('history-key');
    expect(JSON.parse(init.body)).toMatchObject({ dateFrom: '2024-03-10 00:00:00', dateTo: '2024-03-10 23:59:59' });
  });
});
