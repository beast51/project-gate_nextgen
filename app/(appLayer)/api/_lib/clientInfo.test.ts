import { describe, expect, it } from 'vitest';
import { clientInfo, clientIp } from './clientInfo';

const headers = (values: Record<string, string>) => ({ get: (name: string) => values[name] ?? null });

describe('clientIp', () => {
  it('is the first address of the chain the hosting reports', () => {
    expect(clientIp(headers({ 'x-forwarded-for': '203.0.113.7, 10.0.0.1, 10.0.0.2' }))).toBe('203.0.113.7');
    expect(clientIp(headers({ 'x-real-ip': '198.51.100.4' }))).toBe('198.51.100.4');
    expect(clientIp(headers({ 'x-forwarded-for': '2001:db8::1' }))).toBe('2001:db8::1');
    expect(clientIp(headers({}))).toBeNull();
  });

  it('does not store an endless value', () => {
    expect(clientIp(headers({ 'x-forwarded-for': '1'.repeat(500) }))).toHaveLength(64);
  });

  it('describes the browser from the user agent', () => {
    expect(clientInfo(headers({ 'x-forwarded-for': '203.0.113.7', 'user-agent': 'Mozilla/5.0 (Windows NT 10.0) Chrome/126.0 Safari/537.36' })))
      .toEqual({ ip: '203.0.113.7', device: 'Chrome · Windows' });
  });
});
