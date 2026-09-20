import { CallsSource } from '@/core/ports/callsSource';
import { GateUsersDirectory } from '@/core/ports/gateUsersDirectory';

// Telephony of a demo sandbox: no network, no credentials, nothing leaves the process.
// A real gate can not be opened from a demo, and the demo proves that the core does not depend on a provider.

export const createDemoGateUsersDirectory = (): GateUsersDirectory => ({
  // the directory "knows" any phone number it is asked about, a full listing is empty
  find: async (filter = {}) =>
    filter.phoneNumber
      ? [{
        externalId: `demo-${filter.phoneNumber}`,
        name: filter.name || '',
        phoneNumber: filter.phoneNumber,
        carNumber: [],
        apartmentNumber: null,
        isBlackListed: false,
      }]
      : [],
  add: async () => {},
  update: async () => {},
  remove: async () => {},
});

export const createDemoCallsSource = (): CallsSource => ({
  getCalls: async () => [],
});
