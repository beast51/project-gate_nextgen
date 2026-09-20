import { normalizeCarNumber } from '@/core/entities/gateUser';
import { DirectoryEntry, GateUsersDirectory } from '@/core/ports/gateUsersDirectory';
import { UnitalkConfig } from './unitalkConfig';

type Contact = {
  address: string
  email: string
  id: number
  name: string
  note: string
  phones: string[]
  responsible: number | null
}

type ContactsResponse = {
  contacts: Contact[]
  count: number
  limit: number
  offset: number
}

const PAGE_SIZE = 100;

// Unitalk keeps car numbers in the note and the apartment in the address of a contact
const toDirectoryEntry = (contact: Contact): DirectoryEntry => ({
  externalId: contact.id.toString(),
  name: contact.name,
  phoneNumber: contact.phones[0],
  carNumber: contact.note?.split(',') || [],
  apartmentNumber: contact.address,
  isBlackListed: contact.responsible ? false : true,
});

export const createUnitalkGateUsersDirectory = (config: UnitalkConfig): GateUsersDirectory => {
  const headers: Record<string, string> = {
    Authorization: config.authorization,
    ProjectId: config.projectId,
    'Content-Type': 'application/json',
  };

  const post = (path: string, payload: unknown) =>
    fetch(`${config.url}${path}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

  const getPage = async (offset: number, filter: { phoneNumber?: string, name?: string }): Promise<ContactsResponse> => {
    const response = await post('/contacts/get', {
      limit: PAGE_SIZE,
      offset,
      filter: {
        name: filter.name || '',
        phone: filter.phoneNumber || '',
      },
    });

    return response.json();
  };

  return {
    find: async (filter = {}) => {
      const firstPage = await getPage(0, filter);
      const totalPages = Math.ceil(firstPage.count / PAGE_SIZE);

      const pages = await Promise.all(
        Array.from({ length: totalPages }, (_, index) =>
          index === 0 ? firstPage : getPage(index * PAGE_SIZE, filter)
        )
      );

      return pages.flatMap(page => page.contacts.map(toDirectoryEntry));
    },

    add: async (user) => {
      const response = await post('/contacts/set', {
        address: user.apartmentNumber,
        email: '',
        name: user.name,
        note: normalizeCarNumber(user.carNumber),
        phones: [user.phoneNumber],
        responsible: config.canOpenGatesResponsibleId,
      });

      if (!response.ok) {
        throw new Error('Network response was not ok.');
      }
    },

    update: async (changes) => {
      await post('/contacts/set', {
        address: changes.apartmentNumber,
        email: '',
        id: Number(changes.externalId),
        name: changes.name,
        note: normalizeCarNumber(changes.carNumber.join(',')),
        phones: [changes.phoneNumber],
        responsible: changes.isBlackListed ? null : config.canOpenGatesResponsibleId,
      });
    },

    remove: async (externalId) => {
      const formData = new FormData();
      formData.append('id', externalId);

      await fetch(`${config.url}/contacts/remove`, {
        method: 'POST',
        headers: {
          Authorization: config.authorization,
          ProjectId: config.projectId,
        },
        body: formData,
      });
    },
  };
};
