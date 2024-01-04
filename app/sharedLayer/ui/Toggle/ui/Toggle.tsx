'use client';

import { useTheme } from '@/appLayer/providers/ThemeProvider';
import { Dispatch, SetStateAction, createContext } from 'react';
import { FC, ReactNode, useContext, useState } from 'react';
import { CiLight } from 'react-icons/ci';
import { MdOutlineDarkMode } from 'react-icons/md';
import classes from './Toggle.module.scss';

type ToggleCompoundType = {
  children: ReactNode;
  initialValue: boolean;
};

type ToggleContextType = {
  isOn: boolean;
  setIsOn: Dispatch<SetStateAction<boolean>>;
};

const ToggleContext = createContext<ToggleContextType>({
  isOn: false,
  setIsOn: () => {},
});

const TextOn = () => {
  const { isOn } = useContext(ToggleContext);
  return isOn ? <span>On</span> : null;
};
const TextOff = () => {
  const { isOn } = useContext(ToggleContext);
  return !isOn ? <span>Off</span> : null;
};
const SwitchButton = () => {
  const { isOn, setIsOn } = useContext(ToggleContext);
  return (
    <button onClick={() => setIsOn((isOn) => !isOn)}>
      {isOn ? 'ON' : 'OFF'}
    </button>
  );
};

const SwitchTheme = () => {
  const { theme, toggleTheme } = useTheme();
  return (
    <button className={classes.toggleThemeButton} onClick={toggleTheme}>
      {theme === 'light' ? (
        <MdOutlineDarkMode size="48px" color="#11A694" />
      ) : (
        <CiLight size="48px" color="#11A694" />
      )}
    </button>
  );
};

const ToggleCompound: FC<ToggleCompoundType> & {
  TextOn: typeof TextOn;
  TextOff: typeof TextOff;
  SwitchButton: typeof SwitchButton;
  SwitchTheme: typeof SwitchTheme;
} = ({ children, initialValue }) => {
  const [isOn, setIsOn] = useState(initialValue);

  return (
    <ToggleContext.Provider value={{ isOn, setIsOn }}>
      {children}
    </ToggleContext.Provider>
  );
};

ToggleCompound.TextOn = TextOn;
ToggleCompound.TextOff = TextOff;
ToggleCompound.SwitchButton = SwitchButton;
ToggleCompound.SwitchTheme = SwitchTheme;

export const Toggle = () => {
  return (
    <ToggleCompound initialValue={false}>
      <ToggleCompound.TextOn />
      <ToggleCompound.TextOff />
      <ToggleCompound.SwitchTheme />
    </ToggleCompound>
  );
};

export const ToggleTheme = () => {
  return (
    <ToggleCompound initialValue={false}>
      <ToggleCompound.SwitchTheme />
    </ToggleCompound>
  );
};
