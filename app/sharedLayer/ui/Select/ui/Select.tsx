import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import { ukUA } from '@mui/x-date-pickers/locales';
import { enUS } from '@mui/x-date-pickers/locales';
import {
  Select as MuiSelect,
  SelectChangeEvent,
  ThemeProvider,
  createTheme,
} from '@mui/material/';
import { useCurrentLocale } from 'next-i18n-router/client';
import { useTheme } from '@/appLayer/providers/ThemeProvider';
import i18nConfig from '@/sharedLayer/config/i18n/i18nConfig';

type SelectPropsType = {
  label: string;
  value: string;
  onChange: (e: SelectChangeEvent<string>) => void;
  children: React.ReactNode;
};

export const Select: React.FC<SelectPropsType> = ({
  label,
  value,
  onChange,
  children,
}) => {
  const currentLocale = useCurrentLocale(i18nConfig);
  const { theme: THEME } = useTheme();

  const newTheme = createTheme(
    {
      components: {
        MuiPaper: {
          styleOverrides: {
            root: {
              // left: '8px',
              borderRadius: '24px',
              marginTop: '8px',
            },
          },
        },
        MuiButton: {
          styleOverrides: {
            root: {
              color: '#11A694',
            },
          },
        },
        MuiList: {
          styleOverrides: {
            root: {
              padding: '0',
            },
          },
        },
        MuiSvgIcon: {
          styleOverrides: {
            root: {
              color: '#11A694!important',
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
              cursor: 'pointer',
              padding: '6px 18px',
              // width: '90px',
            },
            notchedOutline: {
              borderColor: '#11A694 !important',
              borderRadius: '60px',
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
      <FormControl fullWidth>
        <InputLabel>{label}</InputLabel>
        <MuiSelect value={value} label={label} onChange={onChange}>
          {children}
        </MuiSelect>
      </FormControl>
    </ThemeProvider>
  );
};
