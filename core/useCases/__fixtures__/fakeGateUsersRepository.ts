import { GateUser } from '../../entities/gateUser';
import { GateUsersRepository } from '../../ports/gateUsersRepository';

// In-memory GateUsersRepository with the same rules as the real storage
export const createFakeGateUsersRepository = (stored: GateUser[] = [], lastDirectorySync: Date | null = null) => {
  const state = { users: stored.map(user => ({ ...user })), lastDirectorySync };

  const repository: GateUsersRepository = {
    list: async (filter = {}) =>
      state.users.filter(user => !filter.phoneNumber || user.phoneNumber === filter.phoneNumber).map(user => ({ ...user })),
    listBlackListed: async () => state.users.filter(user => user.isBlackListed).map(user => ({ ...user })),
    findByPhoneNumbers: async (phoneNumbers) => state.users.filter(user => phoneNumbers.includes(user.phoneNumber)),
    addMissing: async (users) => {
      let added = 0;
      for (const user of users) {
        if (state.users.some(existing => existing.phoneNumber === user.phoneNumber)) continue;
        state.users.push({ ...user });
        added++;
      }
      return added;
    },
    update: async ({ phoneNumber, ...changes }) => {
      const user = state.users.find(existing => existing.phoneNumber === phoneNumber);
      if (!user) throw new Error(`Gate user ${phoneNumber} does not exist`);
      Object.entries(changes).forEach(([key, value]) => {
        if (value !== undefined) Object.assign(user, { [key]: value });
      });
    },
    remove: async (phoneNumber) => {
      state.users = state.users.filter(user => user.phoneNumber !== phoneNumber);
    },
    claimDirectorySync: async (now, minIntervalSeconds) => {
      const allowed = !state.lastDirectorySync ||
        now.getTime() - state.lastDirectorySync.getTime() > minIntervalSeconds * 1000;
      if (allowed) state.lastDirectorySync = now;
      return allowed;
    },
  };

  return { repository, state };
};
