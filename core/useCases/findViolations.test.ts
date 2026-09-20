import { describe, expect, it } from 'vitest';
import { findViolations } from './findViolations';
import { findViolationsCases } from './__fixtures__/findViolations.cases';

describe('findViolations (core)', () => {
  it.each(findViolationsCases)('$name', ({ now, calls, expected }) => {
    expect(findViolations(calls, {}, new Date(now))).toEqual(expected);
  });

  it('takes the limits from the rules', () => {
    const [entry, exit] = [
      { ...findViolationsCases[1].calls[0], time: '2024-03-10 10:00:00' },
      { ...findViolationsCases[1].calls[0], time: '2024-03-10 10:20:00' },
    ];

    const result = findViolations([entry, exit], { limitMinutes: 15 }, new Date('2024-03-10 12:00:00'));

    expect(result['12'].violationCount).toBe(1);
    expect(result['12'].visits[0].violation).toBe('has been parked for 20 minutes');
  });

  it('does not mutate the calls it receives', () => {
    const calls = findViolationsCases[2].calls;
    const snapshot = JSON.parse(JSON.stringify(calls));

    findViolations(calls, {}, new Date('2024-03-10 12:00:00'));

    expect(calls).toEqual(snapshot);
  });
});
