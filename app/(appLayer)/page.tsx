'use client';

import styles from './page.module.css';
import cn from 'classnames';
import { useTheme } from './providers/ThemeProvider';

export default function Home() {
  const { toggleTheme } = useTheme();

  return (
    <div className={cn(styles.main)}>
      Project GATE
      <button onClick={toggleTheme}>Theme</button>
    </div>
  );
}
