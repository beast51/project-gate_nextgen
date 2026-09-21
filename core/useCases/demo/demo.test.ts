import { createFakePenaltiesRepository } from '../__fixtures__/fakePenaltiesRepository';
import { describe, expect, it, vi } from 'vitest';
import { Account } from '../../entities/account';
import { AccountsRepository } from '../../ports/accountsRepository';
import { createFakeActivityLog } from '../__fixtures__/fakeActivityLog';
import { createFakeCallsRepository } from '../__fixtures__/fakeCallsRepository';
import { createFakeGateUsersRepository } from '../__fixtures__/fakeGateUsersRepository';
import { createGetViolations } from '../getViolations';
import { createCleanupDemoSandboxes } from './cleanupDemoSandboxes';
import { generateDemoData } from './generateDemoData';
import { countViolationsByDay, statsPeriods, sumViolationStats } from '../violationStats';
import { createSeedDemoSandbox } from './seedDemoSandbox';

const NOW = new Date('2024-03-10T14:00:00.000Z'); // 16:00 in Kyiv

describe('generateDemoData', () => {
  const data = generateDemoData('account-1', NOW);

  it('is deterministic for a seed and different for different seeds', () => {
    expect(generateDemoData('account-1', NOW)).toEqual(data);
    expect(generateDemoData('account-2', NOW).gateUsers.map(user => user.name))
      .not.toEqual(data.gateUsers.map(user => user.name));
  });

  it('uses only phone numbers that can not belong to a real person', () => {
    const numbers = [...data.gateUsers.map(user => user.phoneNumber), ...data.calls.map(call => call.number)];

    expect(numbers.every(number => /^38000\d{7}$/.test(number))).toBe(true);
    expect(new Set(data.gateUsers.map(user => user.phoneNumber)).size).toBe(data.gateUsers.length);
    expect(data.gateUsers.every(user => user.image === null)).toBe(true);
  });

  it('has calls today, none in the future, oldest first', () => {
    const times = data.calls.map(call => call.time);

    expect(times.some(time => time.startsWith('2024-03-10'))).toBe(true);
    expect(times.every(time => time <= '2024-03-10 16:00:00')).toBe(true);
    expect([...times].sort()).toEqual(times);
  });

  it('shows every feature: violations, an open visit, failed and unknown calls, penalties', () => {
    expect(data.calls.some(call => call.outcome === 'connectionFailed')).toBe(true);
    // demo data is not tied to a telephony provider
    expect(data.calls.every(call => call.cause === undefined && call.state === undefined)).toBe(true);
    expect(data.calls.some(call => call.callerName === 'Not registered')).toBe(true);
    expect(data.gateUsers.filter(user => user.isBlackListed)).toHaveLength(2);
  });
});

describe('seedDemoSandbox', () => {
  it('fills an empty sandbox so that the violations page is not empty', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    const gateUsers = createFakeGateUsersRepository();
    const calls = createFakeCallsRepository();
    const activity = createFakeActivityLog();
    const penalties = createFakePenaltiesRepository();

    const seeded = await createSeedDemoSandbox({
      gateUsers: gateUsers.repository, calls: calls.repository, activityLog: activity.log, penalties: penalties.repository,
      actor: { id: 'account-1', name: 'Visitor' }, seed: 'account-1', now: () => NOW,
    })();

    expect(seeded).toBe(true);
    // the journal of a fresh sandbox is not empty, and the prepared actions belong to its owner or to the system
    expect(activity.state.events.length).toBeGreaterThan(3);
    expect(new Set(activity.state.events.map(event => event.actor.id))).toEqual(new Set(['account-1', 'system']));
    expect(activity.state.events.every(event => event.at <= NOW.toISOString())).toBe(true);
    expect(gateUsers.state.users).toHaveLength(18);
    expect(calls.state.calls.length).toBeGreaterThan(20);
    // the blocked gate users have their penalties, and the statistics have older ones to show
    expect(penalties.state.penalties.filter(penalty => !penalty.lifted)).toHaveLength(2);
    expect(penalties.state.penalties.length).toBeGreaterThan(2);
    expect(penalties.state.penalties.every(penalty => penalty.from <= '2024-03-10 23:59:59')).toBe(true);

    const violations = await createGetViolations({ calls: calls.repository, refreshCalls: async () => {} })(
      '2024-03-08 00:00:00',
      '2024-03-10 23:59:59',
    );
    const all = Object.values(violations);
    expect(all.some(visit => visit.violationCount > 0)).toBe(true);
    expect(all.some(visit => visit.visits.some(v => v.violation === 'still parked or train'))).toBe(true);
    vi.useRealTimers();
  });

  it('never touches a sandbox that already has data', async () => {
    const gateUsers = createFakeGateUsersRepository();
    const calls = createFakeCallsRepository();
    const seed = createSeedDemoSandbox({
      gateUsers: gateUsers.repository, calls: calls.repository, activityLog: createFakeActivityLog().log,
      penalties: createFakePenaltiesRepository().repository,
      actor: { id: 'account-1', name: 'Visitor' }, seed: 'account-1', now: () => NOW,
    });

    await seed();
    await gateUsers.repository.remove(gateUsers.state.users[0].phoneNumber);
    const before = { users: gateUsers.state.users.length, calls: calls.state.calls.length };

    expect(await seed()).toBe(false);
    expect({ users: gateUsers.state.users.length, calls: calls.state.calls.length }).toEqual(before);
  });
});

describe('cleanupDemoSandboxes', () => {
  const account = (id: string, tenant: string | null, usedDaysAgo: number): Account => ({
    id, name: id, tenant, role: null, sandboxLastUsedAt: new Date(NOW.getTime() - usedDaysAgo * 24 * 60 * 60 * 1000),
  });

  const accountsWith = (stored: Account[]): AccountsRepository => ({
    findById: async (id) => stored.find(a => a.id === id) ?? null,
    markSandboxUsed: vi.fn(async () => {}),
    listIdleSandboxOwners: async (usedBefore) =>
      stored.filter(a => a.sandboxLastUsedAt && a.sandboxLastUsedAt < usedBefore),
    markSandboxRemoved: vi.fn(async () => {}),
  });

  it('drops only sandboxes idle for more than two weeks', async () => {
    const accounts = accountsWith([account('idle', null, 15), account('active', null, 3)]);
    const drop = vi.fn(async () => {});

    const removed = await createCleanupDemoSandboxes({ accounts, sandboxes: { drop }, now: () => NOW })();

    expect(removed).toEqual(['idle']);
    expect(drop).toHaveBeenCalledTimes(1);
    expect(accounts.markSandboxRemoved).toHaveBeenCalledWith('idle');
  });

  it('never drops anything for an account that works with a customer gate', async () => {
    const accounts = accountsWith([account('operator', 'shota', 400)]);
    const drop = vi.fn(async () => {});

    const removed = await createCleanupDemoSandboxes({ accounts, sandboxes: { drop }, now: () => NOW })();

    expect(removed).toEqual([]);
    expect(drop).not.toHaveBeenCalled();
  });
});

describe('generateDemoData (history for the statistics of violations)', () => {
  const now = new Date('2024-03-13T10:00:00.000Z');
  const data = generateDemoData('history', now);

  it('covers three calendar months before today', () => {
    const days = new Set(data.calls.map(call => call.time.slice(0, 10)));

    expect(days.has('2024-01-01')).toBe(true);
    expect(days.size).toBeGreaterThan(100);
  });

  it('shows violations in every period, but most visitors have none', () => {
    const periods = statsPeriods('2024-03-13');
    // what the storage gives back for stored calls
    const passages = data.calls.map(call => ({
      ...call, apartmentNumber: call.apartmentNumber ?? null, isBlackListed: call.isBlackListed ?? false,
    }));
    const stats = sumViolationStats(countViolationsByDay(passages, {}, new Date('2024-03-13T12:00:00')), periods);
    const total = (period: 'week' | 'month' | 'threeMonths') =>
      Object.values(stats).reduce((sum, s) => sum + s[period].overstays + s[period].openVisits, 0);

    expect(total('week')).toBeGreaterThan(0);
    expect(total('threeMonths')).toBeGreaterThan(total('month'));
    expect(Object.keys(stats).length).toBeLessThan(10);
  });

  it('never lets a visit run over midnight', () => {
    expect(data.calls.every(call => call.time.slice(11) >= '06:00:00')).toBe(true);
  });
});
