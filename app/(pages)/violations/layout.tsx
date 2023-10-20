// 'use client';

import { Sidebar } from '@/widgetsLayer/Sidebar';

// import { ReactNode } from 'react';

// export default function Layout({ children }: { children: ReactNode }) {
//   return <div>{children}</div>;
// }

// import getUsers from '../actions/getUsers';
// import Sidebar from '@/components/sidebar/Sidebar';
// import UserList from './components/UserList/UserList';
// import {
//   getGateUserFromDb,
//   getGateUsersFromApi,
//   isTimeToUpdateGateUser,
//   setGateUsersToBd,
//   setTimeOfLastUpdateGateUser,
// } from '@/services/gateUsers';

export default async function UsersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // getUser - to get users as admins

  // const users = await getGateUserFromDb();

  // const isTimeToUpdate = await isTimeToUpdateGateUser();

  // if (isTimeToUpdate) {
  //   const users = await getGateUsersFromApi();
  //   await setGateUsersToBd(users);
  //   await setTimeOfLastUpdateGateUser();
  //   // console.log('update');
  // }

  // const users = await getGateUserFromDb();
  return (
    <Sidebar type="violationsList" title="">
      <div className="full-height pt64">
        {/* <UserList users={users} /> */}
        {children}
      </div>
    </Sidebar>
  );
}
