import { GateUserDto } from '@/contracts';

// How a change of one gate user shows up in the lists that are already in the cache.
// The lists are corrected at once and then confirmed by the server.

export const withoutGateUser = (list: GateUserDto[] | undefined, phoneNumber: string) =>
  list?.filter(user => user.phoneNumber !== phoneNumber);

export const withChangedGateUser = (list: GateUserDto[] | undefined, changed: GateUserDto) =>
  list?.map(user => (user.phoneNumber === changed.phoneNumber ? { ...user, ...changed } : user));

// the black list holds only users with a penalty, ordered by apartment
export const blackListWithChangedGateUser = (list: GateUserDto[] | undefined, changed: GateUserDto) => {
  if (!list) return list;

  const others = list.filter(user => user.phoneNumber !== changed.phoneNumber);

  if (!changed.isBlackListed) return others;

  const known = list.find(user => user.phoneNumber === changed.phoneNumber);

  return [...others, { ...known, ...changed }].sort((a, b) =>
    (a.apartmentNumber ?? '').localeCompare(b.apartmentNumber ?? ''));
};
