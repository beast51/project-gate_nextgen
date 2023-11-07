import React from 'react';
import styles from './CallsPage.module.scss';
import { CallsList } from '@/entitiesLayer/Calls';

export const CallsPage = async () => {
  return (
    <div className={styles.user}>
      <CallsList />
    </div>
  );
};
