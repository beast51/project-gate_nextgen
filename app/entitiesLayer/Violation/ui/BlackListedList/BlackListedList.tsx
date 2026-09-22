'use client';

import { FC } from 'react';
import { BlackListedGateUsersResponse } from '@/contracts';
import { useBlackListedGateUsers } from '@/sharedLayer/api';
import { BlackListedCard } from '../BlackListedViolationCard/BlackListedCard';

type BlackListedListProps = {
  // the list the server rendered page already has
  users: BlackListedGateUsersResponse
  className?: string
}

// Users with a penalty. Unblocking (by an operator or by the nightly job) refreshes the list without a page reload.
export const BlackListedList: FC<BlackListedListProps> = ({ users: initialUsers, className }) => {
  const { data: users = initialUsers } = useBlackListedGateUsers(initialUsers);

  return (
    <div className={className}>
      {users.map((user) => user.blackListedTo && <BlackListedCard key={user.phoneNumber} user={user} />)}
    </div>
  );
};
