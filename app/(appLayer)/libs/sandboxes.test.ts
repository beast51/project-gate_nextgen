import { describe, expect, it } from 'vitest';
import { sandboxDatabaseUrl } from './sandboxes';

describe('sandboxDatabaseUrl', () => {
  it('points every account to its own database on the demo cluster', () => {
    expect(sandboxDatabaseUrl('mongodb+srv://u:p@demo.example.net/shared?retryWrites=true', '65a1b2c3'))
      .toBe('mongodb+srv://u:p@demo.example.net/demo_65a1b2c3?retryWrites=true');
    expect(sandboxDatabaseUrl('mongodb://localhost:27017', 'abc'))
      .toBe('mongodb://localhost:27017/demo_abc');
    expect(sandboxDatabaseUrl('mongodb+srv://u:p@demo.example.net/shared', 'a1'))
      .not.toBe(sandboxDatabaseUrl('mongodb+srv://u:p@demo.example.net/shared', 'a2'));
  });

  it('does not let an account id change the target database', () => {
    expect(() => sandboxDatabaseUrl('mongodb://localhost:27017/x', 'a/../prod')).toThrow();
    expect(() => sandboxDatabaseUrl('mongodb://localhost:27017/x', 'a?authSource=admin')).toThrow();
    expect(() => sandboxDatabaseUrl('postgres://localhost/x', 'abc')).toThrow();
  });
});
