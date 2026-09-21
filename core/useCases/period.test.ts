import { describe, expect, it } from 'vitest';
import { createFakeAccessLog } from './__fixtures__/fakeAccessLog';
import { createFakeActivityLog } from './__fixtures__/fakeActivityLog';
import { createGetAccessLog } from './access';
import { createGetActivity } from './activity';
import { parsePeriod } from './period';

describe('parsePeriod', () => {
  it('accepts two real dates in the right order and normalizes them to UTC', () => {
    expect(parsePeriod('2024-03-10T00:00:00+02:00', '2024-03-10T23:59:59.999+02:00'))
      .toEqual({ from: '2024-03-09T22:00:00.000Z', to: '2024-03-10T21:59:59.999Z' });
  });

  it('treats anything else as "no period"', () => {
    expect(parsePeriod(undefined, undefined)).toBeUndefined();
    expect(parsePeriod('2024-03-10T00:00:00.000Z', undefined)).toBeUndefined();
    expect(parsePeriod('yesterday', 'today')).toBeUndefined();
    expect(parsePeriod('2024-03-11T00:00:00.000Z', '2024-03-10T00:00:00.000Z')).toBeUndefined();
    expect(parsePeriod({ $gt: '' }, '2024-03-10T00:00:00.000Z')).toBeUndefined();
  });
});

describe('a journal for one day', () => {
  // a Kyiv day (UTC+2 in March) as the browser of an operator sends it
  const day = { from: '2024-03-09T22:00:00.000Z', to: '2024-03-10T21:59:59.999Z' };

  const action = (id: number, at: string, actorId = 'yuriy') => ({
    id: String(id), at, actor: { id: actorId, name: actorId }, action: 'gateUserAdded' as const, subjects: [], details: {},
  });

  it('shows every action of the day, not only the last 10, and nothing from the neighbouring days', async () => {
    const { log } = createFakeActivityLog([
      action(0, '2024-03-09T21:59:59.999Z'),
      ...Array.from({ length: 15 }, (_, index) => action(index + 1, `2024-03-10T10:${String(index).padStart(2, '0')}:00.000Z`)),
      // 23:30 Kyiv time of the 10th is still that day, though it is already the 10th 21:30 in UTC
      action(16, '2024-03-10T21:30:00.000Z'),
      action(17, '2024-03-10T22:00:00.000Z'),
    ]);

    const events = await createGetActivity({ log })(day);

    expect(events).toHaveLength(16);
    expect(events[0].id).toBe('16');
    expect(events.at(-1)?.id).toBe('1');
  });

  it('combines the day with the filter by the account', async () => {
    const { log } = createFakeActivityLog([
      action(1, '2024-03-10T10:00:00.000Z', 'yuriy'), action(2, '2024-03-10T11:00:00.000Z', 'olga'), action(3, '2024-03-12T11:00:00.000Z', 'olga'),
    ]);

    expect((await createGetActivity({ log })({ ...day, actorId: 'olga' })).map(event => event.id)).toEqual(['2']);
  });

  it('falls back to the latest records when the period is broken', async () => {
    const { log } = createFakeActivityLog(Array.from({ length: 12 }, (_, index) => action(index, '2024-03-10T10:00:00.000Z')));

    expect(await createGetActivity({ log })({ from: 'garbage', to: 'garbage' })).toHaveLength(10);
  });

  it('works the same for sign ins and pages', async () => {
    const view = (id: number, at: string) => ({
      id: String(id), at, actor: { id: 'yuriy', name: 'Yuriy' }, kind: 'pageView' as const, path: '/calls', ip: null, device: null,
    });
    const { log } = createFakeAccessLog([
      view(1, '2024-03-09T12:00:00.000Z'),
      ...Array.from({ length: 40 }, (_, index) => view(index + 2, '2024-03-10T12:00:00.000Z')),
    ]);

    expect(await createGetAccessLog({ log })(day)).toHaveLength(40);
    expect(await createGetAccessLog({ log })()).toHaveLength(30);
  });
});
