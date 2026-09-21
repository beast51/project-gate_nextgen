import { afterEach, describe, expect, it, vi } from 'vitest';
import { isFailedOutcome, isPassageOutcome } from '@/core/entities/call';
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
  // the rule of the operators of the gate: the gate opened only when the call ended as "busy"
  it('sees a passage only in a "busy"', () => {
    expect(unitalkCallOutcome({ cause: 17, state: 'BUSY', secondsFullTime: 4 })).toBe('opened');
    expect(unitalkCallOutcome({ cause: 17, state: 'BUSY', secondsFullTime: 6 })).toBe('opened');
  });

  // regression: 8 seconds of "busy" was the entry of a normal visit; dropped, it turned the day into three violations
  it('does not judge a "busy" by its duration', () => {
    expect(unitalkCallOutcome({ cause: 17, state: 'BUSY', secondsFullTime: 8 })).toBe('opened');
    expect(unitalkCallOutcome({ cause: 17, state: 'BUSY', secondsFullTime: 15 })).toBe('opened');
  });

  it('does not take an unanswered call for a passage, whatever the old labels said', () => {
    expect(unitalkCallOutcome({ cause: 16, state: 'NOANSWER', secondsFullTime: 12 })).toBe('notOpened');
    expect(unitalkCallOutcome({ cause: 16, state: 'ANSWER', secondsFullTime: 5 })).toBe('notOpened');
    expect(unitalkCallOutcome({ cause: 16, state: 'NOMONEY', secondsFullTime: 0 })).toBe('notOpened');
    expect(unitalkCallOutcome({ cause: 16, state: 'BUSYOUT', secondsFullTime: 3 })).toBe('notOpened');
    expect(unitalkCallOutcome({ cause: 18 })).toBe('notOpened');
    expect(unitalkCallOutcome({ cause: 19 })).toBe('notOpened');
    expect(unitalkCallOutcome({ cause: 3, state: 'FAIL' })).toBe('notOpened');
    expect(unitalkCallOutcome({ cause: 127 })).toBe('notOpened');
    expect(unitalkCallOutcome({})).toBe('notOpened');
  });

  // what a blocked gate user gets: turned away at once
  it('recognizes a caller the gate refused', () => {
    expect(unitalkCallOutcome({ cause: 16, state: 'NOANSWER', secondsFullTime: 0 })).toBe('refused');
    expect(isPassageOutcome('refused')).toBe(false);
    expect(isFailedOutcome('refused')).toBe(false);
    // no money on the account looks similar, but it is not about the caller
    expect(unitalkCallOutcome({ cause: 16, state: 'NOMONEY', secondsFullTime: 0 })).toBe('notOpened');
  });

  it('keeps the failures of the connection apart: the call never reached the gate', () => {
    expect(unitalkCallOutcome({ cause: 31, state: 'FAIL' })).toBe('connectionFailed');
    expect(unitalkCallOutcome({ cause: 38 })).toBe('operatorError');
    expect(isFailedOutcome(unitalkCallOutcome({ cause: 31 }))).toBe(true);
    expect(isFailedOutcome(unitalkCallOutcome({ cause: 16 }))).toBe(false);
  });

  it('only a "busy" is a passage for the rules of violations', () => {
    expect(isPassageOutcome(unitalkCallOutcome({ cause: 17, state: 'BUSY', secondsFullTime: 5 }))).toBe(true);
    expect(isPassageOutcome(unitalkCallOutcome({ cause: 16, state: 'NOANSWER', secondsFullTime: 8 }))).toBe(false);
    expect(isPassageOutcome(unitalkCallOutcome({ cause: 17, state: 'ANSWER', secondsFullTime: 5 }))).toBe(false);
    expect(isPassageOutcome(unitalkCallOutcome({ cause: 31 }))).toBe(false);
  });

  // a few old records lack the state
  it('lets the cause alone decide when the state was not recorded', () => {
    expect(unitalkCallOutcome({ cause: 17 })).toBe('opened');
    expect(unitalkCallOutcome({ cause: 17, state: null, secondsFullTime: null })).toBe('opened');
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
