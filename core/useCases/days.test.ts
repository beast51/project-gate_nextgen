import { describe, expect, it } from 'vitest';
import { createGateClock, daysBetween, isDay } from './days';

describe('days', () => {
  it('lists the days of a period over a month border', () => {
    expect(daysBetween('2024-02-28', '2024-03-01')).toEqual(['2024-02-28', '2024-02-29', '2024-03-01']);
    expect(daysBetween('2024-03-02', '2024-03-01')).toEqual([]);
  });

  it('accepts only real calendar days', () => {
    expect(isDay('2024-02-29')).toBe(true);
    expect(isDay('2023-02-29')).toBe(false);
    expect(isDay('2024-2-9')).toBe(false);
    expect(isDay('from')).toBe(false);
  });

  // a server in UTC (Vercel) at 22:30 UTC: at the gate it is already tomorrow
  it('tells the day and the wall clock time at the gate, not on the server', () => {
    const clock = createGateClock('Europe/Kyiv', () => new Date('2024-03-10T22:30:00.000Z'));

    expect(clock.today()).toBe('2024-03-11');
    expect(clock.now().getTime()).toBe(new Date('2024-03-11T00:30:00').getTime());
  });
});
