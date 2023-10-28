import React from 'react';
import classes from './GateUsersPage.module.scss';
import { getGateUserFromDb } from '../model/gateUsers';
import { GateUserCard } from '@/app/entitiesLayer/GateUserCard';
import { GateUserType } from '@/app/entitiesLayer/GateUserCard/GateUserCard.type';

export const GateUsersPage = async () => {
  const users = await getGateUserFromDb();
  return (
    <div className={classes.gateUsersPage}>
      USERS Page
      <ul className={classes.gateUserCardList}>
        {users.slice(400, 405).map((user) => {
          return <GateUserCard data={user} key={user.phoneNumber[0]} />;
        })}
      </ul>
    </div>
  );
};
