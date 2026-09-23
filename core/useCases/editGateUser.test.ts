import { describe, expect, it, vi } from 'vitest';
import { GateUser } from '../entities/gateUser';
import { GateUsersDirectory } from '../ports/gateUsersDirectory';
import { createFakeActivity, noActivity } from './__fixtures__/fakeActivityLog';
import { createFakeGateUsersRepository } from './__fixtures__/fakeGateUsersRepository';
import { noPenalties } from './__fixtures__/fakePenaltiesRepository';
import { createEditGateUser } from './editGateUser';

const resident = (overrides: Partial<GateUser> = {}): GateUser => ({
  id: 'id-1',
  externalId: 'ext-1',
  name: 'Ivan',
  phoneNumber: '380501111111',
  carNumber: ['BH1096IC'],
  apartmentNumber: '12',
  image: null,
  additionalImages: [],
  isBlackListed: false,
  blackListedFrom: '',
  blackListedTo: '',
  ...overrides,
});

const directory = (): GateUsersDirectory => ({
  find: vi.fn(async () => []),
  add: vi.fn(async () => {}),
  update: vi.fn(async () => {}),
  remove: vi.fn(async () => {}),
});

describe('editGateUser', () => {
  it('stores the plates normalized and sends them to the directory the same way', async () => {
    const { repository, state } = createFakeGateUsersRepository([resident()]);
    const telephony = directory();

    await createEditGateUser({ directory: telephony, gateUsers: repository, recordActivity: noActivity, penalties: noPenalties })(
      resident({ carNumber: ['вн 1096 іс', '  ВН9754НІ'] }),
    );

    expect(state.users[0].carNumber).toEqual(['BH1096IC', 'BH9754HI']);
    expect(telephony.update).toHaveBeenCalledWith(expect.objectContaining({ carNumber: ['BH1096IC', 'BH9754HI'] }));
  });

  it('does not take the same plate typed with the other keyboard for a change', async () => {
    const { repository } = createFakeGateUsersRepository([resident()]);
    const activity = createFakeActivity();

    await createEditGateUser({ directory: directory(), gateUsers: repository, recordActivity: activity.recordActivity, penalties: noPenalties })(
      resident({ carNumber: ['ВН 1096 ІС'] }),
    );

    expect(activity.state.events).toEqual([]);
  });
});
