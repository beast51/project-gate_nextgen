import { getContainer } from '@/appLayer/libs/container';
import { toGateUserDto } from '@/appLayer/api/_lib/mappers';
import { GateUserType } from '@/entitiesLayer/GateUser/model/types/GateUser.type';

// Data for the server rendered pages. The only place where pages touch the back end:
// when the pages move to the HTTP API, only this file changes.

export const loadGateUsers = async (phoneNumber = ''): Promise<GateUserType[]> => {
  const container = await getContainer();
  if (!container) return [];

  const users = await container.listGateUsers(phoneNumber ? { phoneNumber } : {});
  return users.map(toGateUserDto);
};

export const loadBlackListedGateUsers = async (): Promise<GateUserType[]> => {
  const container = await getContainer();
  if (!container) return [];

  const users = await container.listBlackListedGateUsers();
  return users.map(toGateUserDto);
};
