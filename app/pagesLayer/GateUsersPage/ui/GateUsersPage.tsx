import React from 'react';
import classes from './GateUsersPage.module.scss';
import getIntl from '@/appLayer/providers/ServerIntlProvider/lib/intl';
import { GateUserCardsList } from '@/entitiesLayer/GateUserCardsList/ui/GateUserCardsList';
import { getGateUserFromDb } from '../model/gateUsers';

export const GateUsersPage = async () => {
  const { $t } = await getIntl();
  const users = await getGateUserFromDb();
  return (
    <div className={classes.gateUsersPage}>
      <p className={classes.title}>{$t({ id: 'All users:' })}</p>
      <GateUserCardsList users={users} />
    </div>
  );
};
