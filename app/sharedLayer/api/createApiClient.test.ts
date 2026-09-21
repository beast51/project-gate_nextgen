import { describe, expect, it, vi } from 'vitest';
import { apiKeys, isKeyOf } from './apiKeys';
import { ApiError, createApiClient } from './createApiClient';

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const clientWith = (response: () => Response, extra = {}) => {
  const send = vi.fn(async (..._args: Parameters<typeof fetch>) => response());
  return { send, client: createApiClient({ fetch: send, ...extra }) };
};

describe('api client', () => {
  it('reads a period of calls with an absolute path and no trailing slash', async () => {
    const { send, client } = clientWith(() => jsonResponse([]));

    await client.getCalls({ from: '2024-03-10 00:00:00', to: '2024-03-10 23:59:59' });

    const [url, init] = send.mock.calls[0];
    expect(url).toBe('/api/calls?from=2024-03-10+00%3A00%3A00&to=2024-03-10+23%3A59%3A59');
    expect(new URL(`http://host${url}`).searchParams.get('from')).toBe('2024-03-10 00:00:00');
    expect(init?.method).toBe('GET');
  });

  it('sends only the filters that are set', async () => {
    const { send, client } = clientWith(() => jsonResponse([]));

    await client.getGateUsers();
    await client.getGateUsers({ phoneNumber: '380501111111' });
    await client.getGateUsers({ blackListed: true });

    expect(send.mock.calls.map(([url]) => url)).toEqual([
      '/api/users',
      '/api/users?phoneNumber=380501111111',
      '/api/users?blackListed=true',
    ]);
  });

  it('posts JSON', async () => {
    const { send, client } = clientWith(() => jsonResponse('users'));

    await client.deleteGateUser({ phoneNumber: '380501111111', id: '777' });

    const [url, init] = send.mock.calls[0];
    expect(url).toBe('/api/users/delete_user');
    expect(init?.method).toBe('POST');
    expect(init?.body).toBe('{"phoneNumber":"380501111111","id":"777"}');
    expect(init?.headers).toMatchObject({ 'Content-Type': 'application/json' });
  });

  it('throws a typed error with the message of the server', async () => {
    const { client } = clientWith(() => jsonResponse({ error: 'Record 1 of the backup is not a gate user' }, 400));

    const error = await client.getGateUsers().catch(e => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(400);
    expect(error.message).toBe('Record 1 of the backup is not a gate user');
  });

  it('survives an error without a JSON body', async () => {
    const { client } = clientWith(() => new Response('Internal Error', { status: 500 }));

    await expect(client.getGateUsers()).rejects.toMatchObject({ status: 500 });
  });

  it('reports an expired session', async () => {
    const onUnauthorized = vi.fn();
    const { client } = clientWith(() => jsonResponse({ error: 'Unauthorized' }, 401), { onUnauthorized });

    await expect(client.getCalls({ from: 'a', to: 'b' })).rejects.toMatchObject({ status: 401 });
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  it('works from a server: an absolute origin and the cookies of the visitor', async () => {
    const { send, client } = clientWith(() => jsonResponse([]), {
      baseUrl: 'https://gate.example',
      headers: async () => ({ cookie: 'session=abc' }),
    });

    await client.getGateUsers({ blackListed: true });

    const [url, init] = send.mock.calls[0];
    expect(url).toBe('https://gate.example/api/users?blackListed=true');
    expect(init?.headers).toMatchObject({ cookie: 'session=abc' });
  });
});

describe('api keys', () => {
  it('lets every list of a resource be refreshed at once', () => {
    const keys = [apiKeys.gateUsers(), apiKeys.gateUsers({ blackListed: true }), apiKeys.calls({ from: 'a', to: 'b' })];

    expect(keys.filter(isKeyOf('gateUsers'))).toHaveLength(2);
    expect(apiKeys.gateUsers({})).toEqual(apiKeys.gateUsers());
  });
});
