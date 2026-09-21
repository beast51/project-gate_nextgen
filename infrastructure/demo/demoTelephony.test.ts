import { describe, expect, it } from 'vitest';
import { noActivity } from '@/core/useCases/__fixtures__/fakeActivityLog';
import { createFakeGateUsersRepository } from '@/core/useCases/__fixtures__/fakeGateUsersRepository';
import { createAddGateUser } from '@/core/useCases/addGateUser';
import { createSyncGateUsers } from '@/core/useCases/syncGateUsers';
import { createDemoCallsSource, createDemoGateUsersDirectory } from './demoTelephony';

describe('demo telephony', () => {
  it('lets a demo visitor add a gate user without any real telephony', async () => {
    const { repository, state } = createFakeGateUsersRepository();

    await createAddGateUser({ directory: createDemoGateUsersDirectory(), gateUsers: repository, recordActivity: noActivity })({
      name: 'Visitor',
      phoneNumber: '380001234567',
      carNumber: 'aa 1234 bc',
      apartmentNumber: '5',
    });

    expect(state.users).toEqual([expect.objectContaining({
      externalId: 'demo-380001234567',
      name: 'Visitor',
      carNumber: ['AA1234BC'],
      apartmentNumber: '5',
    })]);
  });

  it('has nothing to download: no contacts and no calls', async () => {
    const { repository } = createFakeGateUsersRepository();

    expect(await createSyncGateUsers({ directory: createDemoGateUsersDirectory(), gateUsers: repository, recordActivity: noActivity })())
      .toEqual({ status: 'synced', found: 0, added: 0 });
    expect(await createDemoCallsSource().getCalls('from', 'to')).toEqual([]);
  });
});
