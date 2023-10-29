import React from 'react';
import classes from './GateUsersPage.module.scss';
import getIntl from '@/appLayer/providers/ServerIntlProvider/lib/intl';
import { GateUserCardsList } from '@/entitiesLayer/GateUserCardsList/ui/GateUserCardsList';

export const GateUsersPage = async () => {
  const { $t } = await getIntl();

  return (
    <div className={classes.gateUsersPage}>
      <p className={classes.title}>{$t({ id: 'All users:' })}</p>
      <GateUserCardsList />
    </div>
  );
};
