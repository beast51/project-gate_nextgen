'use client';
import { FC, PropsWithChildren, useEffect, useMemo, useState } from 'react';
import {
  LOCAL_STORAGE_THEME_KEY,
  Theme,
  ThemeContext,
} from '../lib/ThemeContext';
import cn from 'classnames';

const ThemeProvider: FC<PropsWithChildren> = ({ children }) => {
  useEffect(() => {
    const defaultTheme =
      (localStorage.getItem(LOCAL_STORAGE_THEME_KEY) as Theme) || Theme.LIGHT;
    setTheme(defaultTheme);
  }, []);

  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<Theme>(Theme.LIGHT);

  useEffect(() => {
    setMounted(true);
  }, []);

  const defaultProps = useMemo(
    () => ({
      theme: theme,
      setTheme: setTheme,
    }),
    [theme],
  );

  if (!mounted) {
    return null;
  }

  return (
    <ThemeContext.Provider value={defaultProps}>
      <div className={cn('app', theme)}>{children}</div>
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;
