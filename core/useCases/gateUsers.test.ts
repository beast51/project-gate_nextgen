import { describe, expect, it, vi } from 'vitest';
import { GateUser } from '../entities/gateUser';
import { GateUsersDirectory } from '../ports/gateUsersDirectory';
import { GateUsersRepository } from '../ports/gateUsersRepository';
import { createAddGateUser } from './addGateUser';
import { createDeleteGateUser } from './deleteGateUser';
import { createEditGateUser } from './editGateUser';

const createFakes = () => {
  const log: string[] = [];

  const directory: GateUsersDirectory = {
    find: vi.fn(async () => {
      log.push('directory.find');
      return [{
        externalId: '777',
        name: 'Ivan',
        phoneNumber: '380501111111',
        carNumber: ['AA1111AA'],
        apartmentNumber: '12',
        isBlackListed: false,
      }];
    }),
    add: vi.fn(async () => { log.push('directory.add'); }),
    update: vi.fn(async () => { log.push('directory.update'); }),
    remove: vi.fn(async () => { log.push('directory.remove'); }),
  };

  const gateUsers: GateUsersRepository = {
    list: vi.fn(async () => []),
    listBlackListed: vi.fn(async () => []),
    findByPhoneNumber: vi.fn(async () => null),
    addMissing: vi.fn(async () => { log.push('gateUsers.addMissing'); }),
    update: vi.fn(async () => { log.push('gateUsers.update'); }),
    remove: vi.fn(async () => { log.push('gateUsers.remove'); }),
  };

  return { directory, gateUsers, log };
};

const user: GateUser = {
  id: 'db-id',
  externalId: '777',
  name: 'Ivan',
  phoneNumber: '380501111111',
  carNumber: ['AA1111AA', 'BB2222BB'],
  apartmentNumber: '12',
  image: null,
  additionalImages: [],
  isBlackListed: true,
  blackListedFrom: '2024-03-10 10:00:00',
  blackListedTo: '2024-03-17 10:00:00',
};

describe('addGateUser', () => {
  it('registers the user in the directory first and stores it with the id assigned there', async () => {
    const { directory, gateUsers, log } = createFakes();

    await createAddGateUser({ directory, gateUsers })({
      name: 'Ivan',
      phoneNumber: '380501111111',
      carNumber: 'aa 1111 aa,bb2222bb',
      apartmentNumber: '12',
    });

    expect(log).toEqual(['directory.add', 'directory.find', 'gateUsers.addMissing']);
    expect(directory.find).toHaveBeenCalledWith({ phoneNumber: '380501111111' });
    expect(gateUsers.addMissing).toHaveBeenCalledWith([{
      externalId: '777',
      name: 'Ivan',
      phoneNumber: '380501111111',
      carNumber: ['AA1111AA', 'BB2222BB'],
      apartmentNumber: '12',
      image: null,
      additionalImages: [],
      isBlackListed: false,
      blackListedFrom: '',
      blackListedTo: '',
    }]);
  });

  it('does not store a user the directory does not know', async () => {
    const { directory, gateUsers } = createFakes();
    directory.find = vi.fn(async () => []);

    await expect(createAddGateUser({ directory, gateUsers })({
      name: 'Ivan',
      phoneNumber: '380501111111',
      carNumber: '',
      apartmentNumber: '12',
    })).rejects.toThrow();

    expect(gateUsers.addMissing).not.toHaveBeenCalled();
  });
});

describe('editGateUser', () => {
  it('updates the directory, then the storage, and does not erase images with empty values', async () => {
    const { directory, gateUsers, log } = createFakes();

    await createEditGateUser({ directory, gateUsers })(user);

    expect(log).toEqual(['directory.update', 'gateUsers.update']);
    expect(directory.update).toHaveBeenCalledWith({
      externalId: '777',
      name: 'Ivan',
      phoneNumber: '380501111111',
      carNumber: ['AA1111AA', 'BB2222BB'],
      apartmentNumber: '12',
      isBlackListed: true,
    });
    expect(gateUsers.update).toHaveBeenCalledWith({
      externalId: '777',
      name: 'Ivan',
      phoneNumber: '380501111111',
      carNumber: ['AA1111AA', 'BB2222BB'],
      apartmentNumber: '12',
      isBlackListed: true,
      blackListedFrom: '2024-03-10 10:00:00',
      blackListedTo: '2024-03-17 10:00:00',
    });
  });

  it('passes new images to the storage', async () => {
    const { directory, gateUsers } = createFakes();

    await createEditGateUser({ directory, gateUsers })({ ...user, image: 'a.png', additionalImages: ['b.png'] });

    expect(gateUsers.update).toHaveBeenCalledWith(expect.objectContaining({
      image: 'a.png',
      additionalImages: ['b.png'],
    }));
  });
});

describe('deleteGateUser', () => {
  it('removes the user from the storage, then from the directory', async () => {
    const { directory, gateUsers, log } = createFakes();

    await createDeleteGateUser({ directory, gateUsers })({ phoneNumber: '380501111111', externalId: '777' });

    expect(log).toEqual(['gateUsers.remove', 'directory.remove']);
    expect(gateUsers.remove).toHaveBeenCalledWith('380501111111');
    expect(directory.remove).toHaveBeenCalledWith('777');
  });
});
