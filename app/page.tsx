'use client';
import { useTheme } from '../src/theme/useTheme';
import styles from './page.module.css';
import cn from 'classnames';

export default function Home() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className={cn(styles.main, 'app', theme)}>
      Project GATE
      <button onClick={toggleTheme}>Theme</button>
    </div>
  );
}
