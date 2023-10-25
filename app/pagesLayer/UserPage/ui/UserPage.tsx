'use client';

import React from 'react';
import styles from './UserPage.module.scss';
import { useIntl } from 'react-intl';

export const UserPage = async () => {
  const { $t } = useIntl();
  return <main className={styles.user}>USERS Page</main>;
};
