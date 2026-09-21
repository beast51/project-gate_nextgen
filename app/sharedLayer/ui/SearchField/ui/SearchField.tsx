'use client';

import { FC, useId, useMemo, useState } from 'react';
import type { IconType } from 'react-icons';
import { FaCar, FaHome, FaPhoneAlt, FaSearch } from 'react-icons/fa';
import { MdArrowDropDown, MdClose } from 'react-icons/md';
import { useIntl } from 'react-intl';
import { ListItemIcon, ListItemText, Menu, MenuItem, ThemeProvider, createTheme } from '@mui/material';
import { useTheme } from '@/appLayer/providers/ThemeProvider';
import { SEARCH_MODES, SearchMode } from '@/sharedLayer/lib/search';
import classes from './SearchField.module.scss';

type SearchFieldProps = {
  value: string;
  mode: SearchMode;
  onChange: (value: string) => void;
  onModeChange: (mode: SearchMode) => void;
  autoFocus?: boolean;
};

const MODES: Record<SearchMode, { Icon: IconType, label: string, inputMode: 'search' | 'tel' | 'numeric' }> = {
  all: { Icon: FaSearch, label: 'search mode: all', inputMode: 'search' },
  phone: { Icon: FaPhoneAlt, label: 'search mode: phone', inputMode: 'tel' },
  apartment: { Icon: FaHome, label: 'search mode: apartment', inputMode: 'numeric' },
  car: { Icon: FaCar, label: 'search mode: car', inputMode: 'search' },
};

// The search of a list: what to look by (everything, phone number, apartment, car number) and the text
export const SearchField: FC<SearchFieldProps> = ({ value, mode, onChange, onModeChange, autoFocus }) => {
  const { $t } = useIntl();
  const { theme } = useTheme();
  const id = useId();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  const menuTheme = useMemo(() => createTheme({
    palette: { mode: theme, primary: { main: '#11A694' } },
    components: {
      MuiPaper: { styleOverrides: { root: { borderRadius: '24px', marginTop: '8px' } } },
      MuiList: { styleOverrides: { root: { padding: 0 } } },
    },
  }), [theme]);

  const { Icon, label, inputMode } = MODES[mode];

  const choose = (next: SearchMode) => {
    setAnchor(null);
    onModeChange(next);
  };

  return (
    <div className={classes.field}>
      <label className={classes.label} htmlFor={id}>{$t({ id: label })}</label>

      <button
        type="button"
        className={classes.mode}
        onClick={(event) => setAnchor(event.currentTarget)}
        aria-haspopup="menu"
        aria-expanded={Boolean(anchor)}
        aria-label={$t({ id: 'search mode' })}
      >
        <Icon />
        <MdArrowDropDown className={classes.arrow} />
      </button>

      <input
        id={id}
        type="search"
        inputMode={inputMode}
        enterKeyHint="search"
        autoComplete="off"
        autoFocus={autoFocus}
        className={classes.input}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />

      {value && (
        <button type="button" className={classes.clear} onClick={() => onChange('')} aria-label={$t({ id: 'search: clear' })}>
          <MdClose />
        </button>
      )}

      <ThemeProvider theme={menuTheme}>
        <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
          {SEARCH_MODES.map((item) => {
            const { Icon: ItemIcon, label: itemLabel } = MODES[item];
            return (
              <MenuItem key={item} selected={item === mode} onClick={() => choose(item)}>
                <ListItemIcon><ItemIcon color="#11A694" /></ListItemIcon>
                <ListItemText>{$t({ id: itemLabel })}</ListItemText>
              </MenuItem>
            );
          })}
        </Menu>
      </ThemeProvider>
    </div>
  );
};
