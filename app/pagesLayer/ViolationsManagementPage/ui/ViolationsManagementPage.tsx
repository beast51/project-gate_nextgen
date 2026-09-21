import React from 'react';
import styles from './ViolationsManagementPage.module.scss';
import { loadBlackListedGateUsers } from '../../lib/loadGateUsers';
import { BlackListedList } from '@/entitiesLayer/Violation/ui/BlackListedList/BlackListedList';

export const ViolationsManagementPage = async () => {
  const blackListedUsers = await loadBlackListedGateUsers();

  return (
    <main className={styles.violations}>
      <BlackListedList users={blackListedUsers} className={styles.blackListedList} />
    </main>
  );
};
