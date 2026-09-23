import { describe, expect, it } from 'vitest';
import { normalizeCarNumber, parseCarNumbers } from './gateUser';

describe('normalizeCarNumber', () => {
  it('stores a plate in Latin upper case without spaces, whatever keyboard it was typed with', () => {
    expect(normalizeCarNumber('вн 1096 іс')).toBe('BH1096IC');
    expect(normalizeCarNumber('  ВН9754НІ')).toBe('BH9754HI');
    expect(normalizeCarNumber('bh 1096 ic')).toBe('BH1096IC');
    expect(normalizeCarNumber('BH1096IC')).toBe('BH1096IC');
  });

  it('leaves a letter without a Latin twin and a foreign plate as they are', () => {
    expect(normalizeCarNumber('ВН4615КП')).toBe('BH4615KП');
    expect(normalizeCarNumber('36-bl-zh')).toBe('36-BL-ZH');
  });
});

describe('parseCarNumbers', () => {
  it('splits the comma separated plates the operator typed', () => {
    expect(parseCarNumbers('вн 1096 іс, aa1234bc')).toEqual(['BH1096IC', 'AA1234BC']);
    // no plates is one empty plate: that is how the lists tell "nothing to show"
    expect(parseCarNumbers('')).toEqual(['']);
  });
});
