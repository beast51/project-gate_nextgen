import React from 'react';
import classes from './GateUsersPage.module.scss';
import getIntl from '@/appLayer/providers/ServerIntlProvider/lib/intl';
import { loadGateUsers } from '../../lib/loadGateUsers';
import { Sidebar } from '@/widgetsLayer/Sidebar';
import { UserBrowser } from '@/widgetsLayer/UsersBrowser/ui/UsersBrowser';

export const GateUsersPage = async () => {
  // const { $t } = await getIntl();
  const users = await loadGateUsers();

  return (
    <Sidebar type="usersList" title="Список пользователей:">
      <div className="full-height pt64">
        <div className={classes.gateUsersPage}>
          {/* <p className={classes.title}>{$t({ id: 'All users:' })}</p> */}
          <UserBrowser users={users} />
        </div>
      </div>
    </Sidebar>
  );
};
