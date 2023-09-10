'use client';
import Image from 'next/image';
import styles from './page.module.css';
import { Theme, ThemeContext } from '../src/theme/ThemeContext';
import { useContext } from 'react';
import cn from 'classnames';
import { useTheme } from '../src/theme/useTheme';

export default function Home() {
  const { theme, toggleTheme } = useTheme();

  return (
    <main className={cn(styles.main, 'app', theme)}>
      Project GATE
      <button onClick={toggleTheme}>Theme</button>
    </main>
  );
}
