import { describe, expect, it, vi } from 'vitest';

vi.mock('next/headers', () => ({ headers: () => new Headers() }));

import { requestOrigin } from './serverApi';

const from = (values: Record<string, string>) => (name: string) => values[name] ?? null;

describe('requestOrigin', () => {
  it('is the origin the visitor came to', () => {
    expect(requestOrigin(from({ 'x-forwarded-host': 'gate.example', 'x-forwarded-proto': 'https', host: 'internal:3000' })))
      .toBe('https://gate.example');
    expect(requestOrigin(from({ host: 'gate.example' }))).toBe('https://gate.example');
    expect(requestOrigin(from({ host: 'localhost:3002' }))).toBe('http://localhost:3002');
    expect(requestOrigin(from({ host: 'gate.example', 'x-forwarded-proto': 'https,http' }))).toBe('https://gate.example');
  });

  it('refuses a host that could redirect the request somewhere else', () => {
    expect(() => requestOrigin(from({ host: 'evil.example/path?x=' }))).toThrow();
    expect(() => requestOrigin(from({ host: 'user@evil.example' }))).toThrow();
    expect(() => requestOrigin(from({}))).toThrow();
  });
});
