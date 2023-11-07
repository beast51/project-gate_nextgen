'use client';

import React from 'react';
import styles from './ViolationsPage.module.scss';
import { useIntl } from 'react-intl';
import { ViolationsList } from '@/entitiesLayer/Violation';

// import { useIntl } from 'react-intl';

export const ViolationsPage = async () => {
  const { $t } = useIntl();
  return (
    <main className={styles.violations}>
      <ViolationsList />
    </main>
  );
};
