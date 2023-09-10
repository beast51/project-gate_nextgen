'use client';
import { FC, PropsWithChildren, useEffect, useMemo, useState } from 'react';
import { LOCAL_STORAGE_THEME_KEY, Theme, ThemeContext } from './ThemeContext';

const ThemeProvider: FC<PropsWithChildren> = ({ children }) => {
  useEffect(() => {
    const defaultTheme =
      (localStorage.getItem(LOCAL_STORAGE_THEME_KEY) as Theme) || Theme.LIGHT;
    setTheme(defaultTheme);
  }, []);

  const [theme, setTheme] = useState<Theme>(Theme.LIGHT);

  const defaultProps = useMemo(
    () => ({
      theme: theme,
      setTheme: setTheme,
    }),
    [theme],
  );

  return (
    <ThemeContext.Provider value={defaultProps}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;
