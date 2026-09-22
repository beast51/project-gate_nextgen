import { BlackListedGateUsersResponse, GateUsersQuery, GateUsersResponse } from '@/contracts';
import { ApiError } from '@/sharedLayer/api/createApiClient';
import { getServerApi } from '@/sharedLayer/framework/serverApi';

// Data for the server rendered pages, loaded over HTTP like everything else in the UI

const load = async (query: GateUsersQuery): Promise<GateUsersResponse> => {
  try {
    return await (await getServerApi()).getGateUsers(query);
  } catch (error) {
    // a visitor without a session sees an empty page, the middleware sends them to the sign in form
    if (error instanceof ApiError && error.status === 401) return [];
    throw error;
  }
};

export const loadGateUsers = (phoneNumber = '') => load(phoneNumber ? { phoneNumber } : {});

// everybody who lives in the apartment
export const loadGateUsersOfApartment = (apartmentNumber: string) => load({ apartmentNumber });

export const loadBlackListedGateUsers = async (): Promise<BlackListedGateUsersResponse> => {
  try {
    return await (await getServerApi()).getBlackListedGateUsers();
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return [];
    throw error;
  }
};
