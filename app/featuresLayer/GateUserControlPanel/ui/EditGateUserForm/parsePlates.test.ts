import { describe, expect, it } from 'vitest';
import { parsePlates, platesLine } from './parsePlates';

describe('parsePlates', () => {
  it('splits the typed line by commas, the spaces around a plate do not matter', () => {
    expect(parsePlates('ВН 1096 ІС ,  bh9754hi', ['BH1096IC'])).toEqual(['ВН 1096 ІС', 'bh9754hi']);
  });

  it('an empty line keeps the stored "no plates" value, whichever it is', () => {
    expect(parsePlates('', [''])).toEqual(['']);
    expect(parsePlates('  ', [])).toEqual([]);
    expect(parsePlates('', ['BH1096IC'])).toEqual(['']);
  });

  it('shows the stored plates as one line and hides the empty one', () => {
    expect(platesLine(['BH1096IC', 'BH9754HI'])).toBe('BH1096IC, BH9754HI');
    expect(platesLine([''])).toBe('');
  });
});
