import { describe, expect, it, vi } from 'vitest';
import { GateUser } from '../entities/gateUser';
import { GateUsersDirectory } from '../ports/gateUsersDirectory';
import { createFakeActivity, createFakeActivityLog } from './__fixtures__/fakeActivityLog';
import { createFakeGateUsersRepository } from './__fixtures__/fakeGateUsersRepository';
import { createGetActivity, createRecordActivity } from './activity';
import { createAddGateUser } from './addGateUser';
import { createDeleteGateUser } from './deleteGateUser';
import { createEditGateUser } from './editGateUser';
import { createImportGateUsers } from './importGateUsers';
import { createUnblockExpiredPenalties } from './unblockExpiredPenalties';

const resident = (phoneNumber: string, overrides: Partial<GateUser> = {}): GateUser => ({
  id: `id-${phoneNumber}`,
  externalId: `ext-${phoneNumber}`,
  name: 'Ivan',
  phoneNumber,
  carNumber: ['AA1111AA'],
  apartmentNumber: '12',
  image: 'photo.png',
  additionalImages: [],
  isBlackListed: false,
  blackListedFrom: '',
  blackListedTo: '',
  ...overrides,
});

const directory = (): GateUsersDirectory => ({
  find: vi.fn(async ({ phoneNumber } = {}) => [{
    externalId: 'ext-new', name: 'New', phoneNumber: phoneNumber || '', carNumber: [], apartmentNumber: '5', isBlackListed: false,
  }]),
  add: vi.fn(async () => {}),
  update: vi.fn(async () => {}),
  remove: vi.fn(async () => {}),
});

describe('activity journal', () => {
  it('records who added a gate user, when, and a snapshot of the user', async () => {
    const { repository } = createFakeGateUsersRepository();
    const activity = createFakeActivity({ id: 'account-7', name: 'Yuriy' });

    await createAddGateUser({ directory: directory(), gateUsers: repository, recordActivity: activity.recordActivity })({
      name: 'New', phoneNumber: '380001112233', carNumber: 'aa 1234 bc', apartmentNumber: '5',
    });

    expect(activity.state.events).toEqual([{
      id: '1',
      at: '2024-03-10T12:00:00.000Z',
      actor: { id: 'account-7', name: 'Yuriy' },
      action: 'gateUserAdded',
      subjects: [{ phoneNumber: '380001112233', name: 'New', apartmentNumber: '5', carNumber: ['AA1234BC'] }],
      details: {},
    }]);
  });

  it('keeps a removed user readable: the snapshot is taken before the removal', async () => {
    const { repository } = createFakeGateUsersRepository([resident('380501111111')]);
    const activity = createFakeActivity();

    await createDeleteGateUser({ directory: directory(), gateUsers: repository, recordActivity: activity.recordActivity })(
      { phoneNumber: '380501111111', externalId: 'ext-380501111111' },
    );

    expect(activity.state.events[0]).toMatchObject({
      action: 'gateUserRemoved',
      subjects: [{ phoneNumber: '380501111111', name: 'Ivan', apartmentNumber: '12', carNumber: ['AA1111AA'] }],
    });
  });

  it('tells blocking, unblocking and a change of data apart, though they arrive as the same edit', async () => {
    const { repository } = createFakeGateUsersRepository([resident('380501111111')]);
    const activity = createFakeActivity();
    const edit = createEditGateUser({ directory: directory(), gateUsers: repository, recordActivity: activity.recordActivity });

    await edit(resident('380501111111', { isBlackListed: true, blackListedFrom: '2024-03-10 12:00:00', blackListedTo: '2024-03-17 23:50:00' }));
    await edit(resident('380501111111', { isBlackListed: false, blackListedFrom: '2024-03-10 12:00:00', blackListedTo: '2024-03-17 23:50:00' }));
    await edit(resident('380501111111', { name: 'Ivan Petrenko', carNumber: ['AA1111AA', 'BB2222BB'] }));

    expect(activity.state.events.map(event => [event.action, event.details])).toEqual([
      ['gateUserBlocked', { blockedUntil: '2024-03-17 23:50:00', changedFields: [] }],
      ['gateUserUnblocked', { changedFields: [] }],
      ['gateUserChanged', { changedFields: ['name', 'carNumber'] }],
    ]);
  });

  it('does not record an edit that changed nothing, and an empty image is not a change', async () => {
    const { repository } = createFakeGateUsersRepository([resident('380501111111')]);
    const activity = createFakeActivity();

    await createEditGateUser({ directory: directory(), gateUsers: repository, recordActivity: activity.recordActivity })(
      resident('380501111111', { image: null }),
    );

    expect(activity.state.events).toEqual([]);
  });

  it('records expired penalties as one entry with the cards of everybody who was unblocked', async () => {
    const expired = { isBlackListed: true, blackListedFrom: '2024-03-01 10:00:00', blackListedTo: '2024-03-08 10:00:00' };
    const { repository } = createFakeGateUsersRepository([
      resident('380501111111', expired),
      resident('380502222222', { ...expired, name: 'Olga', apartmentNumber: '45' }),
      resident('380503333333', { isBlackListed: true, blackListedTo: '2024-04-01 10:00:00' }),
    ]);
    const activity = createFakeActivity({ id: 'system', name: 'system' });

    await createUnblockExpiredPenalties({ directory: directory(), gateUsers: repository, recordActivity: activity.recordActivity })(
      new Date('2024-03-10T12:00:00'),
    );

    expect(activity.state.events).toHaveLength(1);
    expect(activity.state.events[0]).toMatchObject({ action: 'expiredPenaltiesUnblocked', actor: { id: 'system' } });
    expect(activity.state.events[0].subjects.map(subject => [subject.name, subject.apartmentNumber])).toEqual([['Ivan', '12'], ['Olga', '45']]);
  });

  it('records nothing when there was nobody to unblock', async () => {
    const { repository } = createFakeGateUsersRepository([resident('380501111111')]);
    const activity = createFakeActivity();

    await createUnblockExpiredPenalties({ directory: directory(), gateUsers: repository, recordActivity: activity.recordActivity })();

    expect(activity.state.events).toEqual([]);
  });

  it('counts a bulk import instead of listing everybody', async () => {
    const { repository } = createFakeGateUsersRepository([resident('380501111111')]);
    const activity = createFakeActivity();

    await createImportGateUsers({ gateUsers: repository, recordActivity: activity.recordActivity })(
      [resident('380501111111'), resident('380502222222')],
    );

    expect(activity.state.events[0]).toMatchObject({ action: 'gateUsersImported', subjects: [], details: { received: 2, added: 1, skipped: 1 } });
  });

  it('never fails the action of the operator when the journal is unavailable', async () => {
    const { repository, state } = createFakeGateUsersRepository([resident('380501111111')]);
    const brokenLog = { ...createFakeActivityLog().log, record: vi.fn(async () => { throw new Error('storage is down'); }) };
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});

    await createDeleteGateUser({
      directory: directory(),
      gateUsers: repository,
      recordActivity: createRecordActivity({ log: brokenLog, actor: { id: 'a', name: 'A' } }),
    })({ phoneNumber: '380501111111', externalId: 'ext' });

    expect(state.users).toEqual([]);
    expect(errors).toHaveBeenCalled();
    errors.mockRestore();
  });
});

describe('getActivity', () => {
  const event = (id: number, actorId: string) => ({
    id: String(id), at: `2024-03-10T12:00:0${id}.000Z`, actor: { id: actorId, name: actorId },
    action: 'gateUserAdded' as const, subjects: [], details: {},
  });

  it('returns the last 10 actions of everybody by default, the newest first', async () => {
    const { log } = createFakeActivityLog(Array.from({ length: 12 }, (_, index) => event(index, index % 2 ? 'olga' : 'yuriy')));

    const events = await createGetActivity({ log })();

    expect(events).toHaveLength(10);
    expect(events[0].id).toBe('11');
  });

  it('filters by the account and keeps the limit sane', async () => {
    const { log } = createFakeActivityLog(Array.from({ length: 6 }, (_, index) => event(index, index % 2 ? 'olga' : 'yuriy')));
    const getActivity = createGetActivity({ log });

    expect((await getActivity({ actorId: 'olga' })).map(e => e.actor.id)).toEqual(['olga', 'olga', 'olga']);
    expect(await getActivity({ limit: -5 })).toHaveLength(1);
    expect(await getActivity({ limit: 100000 })).toHaveLength(6);
    expect((await log.listActors()).map(actor => actor.id).sort()).toEqual(['olga', 'yuriy']);
  });
});
