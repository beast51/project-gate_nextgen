import React from 'react';
import styles from './ViolationsManagementPage.module.scss';
import { useIntl } from 'react-intl';
import { loadBlackListedGateUsers } from '../../lib/loadGateUsers';
import { BlackListedCard } from '@/entitiesLayer/Violation/ui/BlackListedViolationCard/BlackListedCard';

// import { useIntl } from 'react-intl';

export const ViolationsManagementPage = async () => {
  // const { $t } = useIntl();
  const blackListedUsers = await loadBlackListedGateUsers();

  return (
    <main className={styles.violations}>
      <div className={styles.blackListedList}>
        {blackListedUsers.map((user) => {
          return (
            user.blackListedTo && (
              <BlackListedCard key={user.phoneNumber} user={user} />
            )
          );
        })}
      </div>
    </main>
  );
};
