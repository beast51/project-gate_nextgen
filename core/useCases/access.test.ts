import { describe, expect, it, vi } from 'vitest';
import { describeDevice, normalizePagePath } from '../entities/access';
import { createFakeAccessLog } from './__fixtures__/fakeAccessLog';
import { createGetAccessLog, createRecordPageView, createRecordSignIn } from './access';

const LOCALES = ['uk', 'en'];
const actor = { id: 'account-7', name: 'Yuriy' };
const client = { ip: '203.0.113.7', device: 'Chrome · Windows' };

describe('normalizePagePath', () => {
  it('keeps the page and drops the locale, the query and the fragment', () => {
    expect(normalizePagePath('/en/calls?from=2024-03-10+00:00:00&to=x', LOCALES)).toBe('/calls');
    expect(normalizePagePath('/users/380501111111#top', LOCALES)).toBe('/users/380501111111');
    expect(normalizePagePath('/uk', LOCALES)).toBe('/');
    expect(normalizePagePath('/', LOCALES)).toBe('/');
    // "en" is a locale only as the first segment
    expect(normalizePagePath('/users/en', LOCALES)).toBe('/users/en');
  });

  it('refuses what is not a page of the application', () => {
    expect(normalizePagePath('https://evil.example/x', LOCALES)).toBeNull();
    expect(normalizePagePath('//evil.example/x', LOCALES)).toBeNull();
    expect(normalizePagePath('calls', LOCALES)).toBeNull();
    expect(normalizePagePath(undefined, LOCALES)).toBeNull();
    expect(normalizePagePath({ path: '/calls' }, LOCALES)).toBeNull();
    expect(normalizePagePath(`/${'a'.repeat(500)}`, LOCALES)).toHaveLength(200);
  });
});

describe('describeDevice', () => {
  it('names the browser and the system', () => {
    expect(describeDevice('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36')).toBe('Chrome · Windows');
    expect(describeDevice('Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1')).toBe('Safari · iOS');
    expect(describeDevice('Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36')).toBe('Chrome · Android');
    expect(describeDevice('Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 Chrome/126.0 Safari/537.36 Edg/126.0')).toBe('Edge · Windows');
    expect(describeDevice('Mozilla/5.0 (X11; Linux x86_64; rv:127.0) Gecko/20100101 Firefox/127.0')).toBe('Firefox · Linux');
    expect(describeDevice('curl/8.5.0')).toBeNull();
    expect(describeDevice(null)).toBeNull();
  });
});

describe('access journal', () => {
  const at = (iso: string) => () => new Date(iso);

  it('records a sign in with the address and the device the server saw', async () => {
    const { log, state } = createFakeAccessLog();

    await createRecordSignIn({ log, actor, now: at('2024-03-10T12:00:00.000Z') })(client);

    expect(state.events).toEqual([{
      id: '1', at: '2024-03-10T12:00:00.000Z', actor, kind: 'signIn', path: null, ip: '203.0.113.7', device: 'Chrome · Windows',
    }]);
  });

  it('records the opened pages in order', async () => {
    const { log, state } = createFakeAccessLog();
    let clock = new Date('2024-03-10T12:00:00.000Z').getTime();
    const view = createRecordPageView({ log, actor, locales: LOCALES, now: () => new Date(clock) });

    for (const path of ['/en/users', '/en/users/380501111111', '/en/calls?from=a']) {
      await view(path, client);
      clock += 60_000;
    }

    expect(state.events.map(event => event.path)).toEqual(['/users', '/users/380501111111', '/calls']);
  });

  it('counts a page reported twice within a few seconds as one opening', async () => {
    const { log, state } = createFakeAccessLog();
    let clock = new Date('2024-03-10T12:00:00.000Z').getTime();
    const view = createRecordPageView({ log, actor, locales: LOCALES, now: () => new Date(clock) });

    await view('/calls', client);
    clock += 1000;
    await view('/uk/calls', client);
    expect(state.events).toHaveLength(1);

    // the same page opened again later is a new opening, so is another page right away
    clock += 10_000;
    await view('/calls', client);
    await view('/users', client);
    expect(state.events.map(event => event.path)).toEqual(['/calls', '/calls', '/users']);
  });

  it('ignores a path that is not a page and never throws', async () => {
    const { log, state } = createFakeAccessLog();
    const view = createRecordPageView({ log, actor, locales: LOCALES });

    await view('https://evil.example', client);
    expect(state.events).toEqual([]);

    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    const broken = { ...log, record: async () => { throw new Error('storage is down'); } };
    await expect(createRecordSignIn({ log: broken, actor })(client)).resolves.toBeUndefined();
    await expect(createRecordPageView({ log: broken, actor, locales: LOCALES })('/calls', client)).resolves.toBeUndefined();
    errors.mockRestore();
  });

  it('shows the last 30 records by default and filters by the account', async () => {
    const { log } = createFakeAccessLog(Array.from({ length: 40 }, (_, index) => ({
      id: String(index), at: '2024-03-10T12:00:00.000Z', actor: { id: index % 2 ? 'olga' : 'yuriy', name: 'x' },
      kind: 'pageView' as const, path: '/calls', ip: null, device: null,
    })));
    const getAccessLog = createGetAccessLog({ log });

    expect(await getAccessLog()).toHaveLength(30);
    expect((await getAccessLog({ actorId: 'olga', limit: 5 })).every(event => event.actor.id === 'olga')).toBe(true);
    expect(await getAccessLog({ limit: 100000 })).toHaveLength(40);
  });
});
