import { describe, expect, it } from 'vitest';
import { VisitsDto } from '@/contracts';
import { matchesSearch } from '@/sharedLayer/lib/search';
import { searchableVisitor } from './searchableVisitor';

const visits = (aboutUser: VisitsDto['aboutUser']): VisitsDto => ({ visitCount: 1, violationCount: 0, visits: [], aboutUser });

// the shapes GET /api/violations really returns
const apartment = visits({ number: ['380660952656'], carNumber: ['BH 1096 IC'], image: null, name: null });
const caller = visits({ carNumber: [], image: null, apartmentNumber: null, name: 'Courier' });

describe('searchableVisitor', () => {
  it('finds an apartment by the key of its card: the visitor itself carries no apartment number', () => {
    expect(matchesSearch(searchableVisitor('441', apartment), '44', 'apartment')).toBe(true);
    expect(matchesSearch(searchableVisitor('441', apartment), '41', 'apartment')).toBe(false);
    expect(matchesSearch(searchableVisitor('441', apartment), '066-095', 'phone')).toBe(true);
    // the key of an apartment is not a phone number
    expect(matchesSearch(searchableVisitor('441', apartment), '441', 'phone')).toBe(false);
  });

  it('finds a caller without an apartment by the phone number, which is the key', () => {
    expect(matchesSearch(searchableVisitor('380501234567', caller), '050-123', 'phone')).toBe(true);
    expect(matchesSearch(searchableVisitor('380501234567', caller), '380', 'apartment')).toBe(false);
    expect(matchesSearch(searchableVisitor('380501234567', caller), 'cour', 'all')).toBe(true);
  });
});
