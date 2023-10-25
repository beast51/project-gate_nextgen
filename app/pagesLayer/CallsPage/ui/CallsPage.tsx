'use client';

import React from 'react';
import styles from './CallsPage.module.scss';
import { useIntl } from 'react-intl';

export const CallsPage = async () => {
  const { $t } = useIntl();
  return <main className={styles.user}>Calls Page</main>;
};
