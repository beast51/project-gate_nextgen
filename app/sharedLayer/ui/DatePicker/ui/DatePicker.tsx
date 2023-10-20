'use client';

import React from 'react';
import { useTheme } from '(appLayer)/providers/ThemeProvider';
import { MobileDatePicker } from '@mui/x-date-pickers';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider/LocalizationProvider';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { ukUA } from '@mui/x-date-pickers/locales';
import { enUS } from '@mui/x-date-pickers/locales';
import 'moment/locale/uk';
import { useCurrentLocale } from 'next-i18n-router/client';
import i18nConfig from '@/sharedLayer/config/i18n/i18nConfig';
import { DatePickerTypeProps } from '../DatePicker.type';

export const DatePicker: React.FC<DatePickerTypeProps> = ({
  label,
  selectedDate,
  onAccept,
}) => {
  const currentLocale = useCurrentLocale(i18nConfig);
  const { theme: THEME } = useTheme();

  const newTheme = createTheme(
    {
      components: {
        MuiButton: {
          styleOverrides: {
            root: {
              color: '#11A694',
            },
          },
        },
        MuiButtonBase: {
          styleOverrides: {
            root: {
              '&.Mui-selected': {
                backgroundColor: '#11A694 !important',
              },
            },
          },
        },
        MuiFormLabel: {
          styleOverrides: {
            root: {
              '&.Mui-focused': {
                color: '#11A694',
              },
            },
          },
        },
        MuiOutlinedInput: {
          styleOverrides: {
            input: {
              padding: '6px 18px',
              width: '90px',
            },
            notchedOutline: {
              borderColor: '#11A694 !important',
            },
          },
        },
      },
      palette: {
        mode: THEME,
      },
    },
    currentLocale === 'uk' ? ukUA : enUS,
  );

  return (
    <ThemeProvider theme={newTheme}>
      <LocalizationProvider
        dateAdapter={AdapterMoment}
        adapterLocale={currentLocale}
      >
        <MobileDatePicker
          label={label}
          format="DD-MM-YYYY"
          value={selectedDate}
          onAccept={onAccept}
        />
      </LocalizationProvider>
    </ThemeProvider>
  );
};
