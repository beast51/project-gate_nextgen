'use client';

import React from 'react';
import styles from './ViolationsPage.module.scss';
import { useIntl } from 'react-intl';

// import { useIntl } from 'react-intl';

export const ViolationsPage = async () => {
  const { $t } = useIntl();
  return <main className={styles.user}>Violations Page</main>;
};
